# Diagramas de sequência — autenticação por CPF e abertura de Ordem de Serviço

## 1. Autenticação do cliente por CPF

```mermaid
sequenceDiagram
  autonumber
  actor C as Cliente
  participant GW as API Gateway HTTP<br/>(oficina-infra-k8s)
  participant L as Lambda auth-cpf<br/>(oficina-auth-lambda)
  participant DB as RDS MySQL<br/>(oficina-infra-db)
  participant CW as CloudWatch Logs

  C->>GW: POST /auth/cpf { "cpf": "111.444.777-35" }
  GW->>L: evento HTTP v2 (requestContext.requestId)
  L->>L: normaliza e valida dígitos verificadores
  alt CPF malformado
    L-->>GW: 400 { erro: "CPF_INVALIDO" }
    GW-->>C: 400
  else CPF válido
    L->>DB: SELECT id, nome, documento, ativo FROM clientes WHERE documento = ? AND tipo_documento = 'CPF'
    DB-->>L: linha (ou vazio)
    alt não cadastrado
      L-->>GW: 401 { erro: "NAO_AUTORIZADO" }
      GW-->>C: 401
    else ativo = false
      L-->>GW: 403 { erro: "CLIENTE_INATIVO" }
      GW-->>C: 403
    else ativo
      L->>L: jwt.sign({ sub: id, cpf, papel: "cliente" }, JWT_SECRET, HS256, 1h)
      L-->>GW: 200 { token, tipo: "Bearer", expiraEm, cliente: { id, nome } }
      GW-->>C: 200 (+ x-request-id)
    end
  end
  L--)CW: log JSON { requestId, status, cpf: "*********35", duracaoMs }
```

Pontos de atenção: o CPF nunca aparece completo nos logs; o segredo `JWT_SECRET` é o mesmo da
API (contrato testado nos dois repositórios); a validade do token é de 1 hora.

## 2. Uso do token no portal do cliente: consultar e aprovar a própria OS

```mermaid
sequenceDiagram
  autonumber
  actor C as Cliente
  participant GW as API Gateway
  participant API as oficina-api (EKS)
  participant MW as AutenticacaoMiddleware<br/>+ PapelMiddleware
  participant UC as AprovarMinhaOrdem
  participant DB as RDS MySQL
  participant EV as Barramento de eventos<br/>+ Políticas

  C->>GW: POST /me/work-orders/{id}/approval<br/>Authorization: Bearer <jwt cliente>
  GW->>API: proxy via VPC Link → NLB (x-request-id = requestId do gateway)
  API->>MW: verificar JWT (HS256, JWT_SECRET)
  MW->>MW: papel ∈ ['cliente']? senão 403
  MW->>UC: executar({ clienteId: sub, ordemId: id })
  UC->>DB: buscarPorId(ordemId)
  DB-->>UC: OrdemServico
  alt ordem.clienteId ≠ sub
    UC-->>API: RecursoNaoEncontrado → 404 (não revela existência)
  else é do cliente
    UC->>UC: ordem.aprovar() (AGUARDANDO_APROVACAO → EM_EXECUCAO)
    UC->>DB: salvar(ordem) + histórico de status
    UC->>EV: publicar ordem-servico.aprovada (após commit)
    EV-->>DB: Política: utilizar peças reservadas (Estoque)
    EV-->>C: Política: notificar cliente (e-mail)
    UC-->>API: OrdemServicoDTO
  end
  API-->>GW: 200 { id, status: "EM_EXECUCAO", ... } + x-request-id
  GW-->>C: 200
```

## 3. Abertura de Ordem de Serviço pelo atendente

```mermaid
sequenceDiagram
  autonumber
  actor A as Atendente
  participant GW as API Gateway
  participant API as oficina-api (EKS)
  participant MW as AutenticacaoMiddleware<br/>+ PapelMiddleware(admin)
  participant UC as CriarOrdemServico
  participant ACL as Portais ACL<br/>(Clientes, Veículos, Catálogo, Estoque)
  participant UoW as Unidade de Trabalho (transação)
  participant DB as RDS MySQL
  participant EV as Barramento de eventos
  participant NR as New Relic

  A->>GW: POST /auth/login { email, senha }
  GW->>API: proxy
  API-->>A: 200 { token (papel: admin) }

  A->>GW: POST /work-orders { clienteId, veiculoId, servicos[], pecas[] }<br/>Authorization: Bearer <jwt admin>
  GW->>API: proxy (x-request-id)
  API->>MW: verificar JWT e papel admin
  MW->>UC: executar(dados validados)
  UC->>ACL: cliente existe? veículo pertence ao cliente? serviços ativos? preços?
  ACL->>DB: consultas
  DB-->>ACL: dados
  ACL-->>UC: ok (ou RecursoNaoEncontrado 404 / RegraDeNegocioViolada 422)
  UC->>UoW: iniciar transação
  UC->>UC: OrdemServico.abrir(...) + itens (snapshot de descrição e preço)
  UC->>ACL: reservar peças no estoque
  ACL->>DB: UPDATE pecas SET quantidade_reservada = ... (mesma transação)
  UC->>DB: INSERT ordens_servico, itens_ordem_servico, historico_status_os (RECEBIDA)
  UC->>UoW: commit
  UoW->>EV: publicar ordem-servico.aberta (após commit)
  EV-->>NR: evento OrdemServicoCriada (volume diário)
  UC-->>API: OrdemServicoDTO (status RECEBIDA, orçamento)
  API-->>GW: 201 + x-request-id
  GW-->>A: 201
  API--)NR: transação APM + log JSON { requestId, trace.id, rota, status, duracaoMs }
```

Em caso de falha na reserva de estoque (saldo insuficiente), o `rollback` da Unidade de Trabalho
desfaz a OS e os itens: estoque e OS nunca ficam inconsistentes (RFC 0002).

## Relacionados

- [Diagrama de componentes](./diagrama-de-componentes.md)
- [RFC 0003 — Estratégia de autenticação](../rfc/0003-estrategia-de-autenticacao.md)
- [ADR 0001 — Arquitetura orientada a eventos](../adr/0001-arquitetura-orientada-a-eventos.md)
- [Mapa de contexto](../diagrama-de-contexto.md)
