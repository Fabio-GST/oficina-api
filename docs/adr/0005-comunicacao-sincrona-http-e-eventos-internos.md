# ADR 0005 — Padrão de comunicação: HTTP síncrono entre serviços, eventos de domínio dentro da aplicação

- **Status:** Aceito
- **Data:** 2026-10-06

## Contexto

A Fase 3 divide o sistema em componentes de execução distintos: API Gateway, Function
Serverless de autenticação, aplicação no EKS e banco gerenciado. É preciso decidir como eles se
comunicam e se a arquitetura orientada a eventos da Fase 2 (ADR 0001, barramento in-process)
deve virar mensageria entre serviços.

## Decisão

| Fronteira | Padrão | Motivo |
| --- | --- | --- |
| Cliente → API Gateway → Lambda / API | **HTTP síncrono** (REST + JSON, JWT Bearer) | O cliente precisa da resposta imediata (token, OS criada). |
| Lambda → banco; API → banco | **Conexão direta MySQL** dentro da VPC, por security group | Não há serviço intermediário de dados; o banco é o ponto de integração compartilhado apenas para leitura de `clientes` pela Lambda. |
| Lambda ↔ API | **Sem chamada direta**: integram-se pelo **contrato do JWT** (RFC 0003) e pelo banco | Evita acoplamento de runtime; a Lambda não depende de a API estar de pé. |
| Entre bounded contexts **dentro** da API | **Eventos de domínio in-process** com publicação após commit (ADR 0001) e Políticas | Mantém o desacoplamento interno sem introduzir um broker. |
| API → sistemas externos (e-mail, webhook de decisão de orçamento) | HTTP/SMTP síncrono com **falha isolada** nas Políticas e evento `IntegracaoFalhou` para alerta | A falha de uma notificação não pode reverter uma OS já persistida. |
| Entre repositórios de infraestrutura | **Parâmetros no SSM e segredos no Secrets Manager** (ADR 0002) | Integração por configuração, não por chamadas. |

Não se adota, nesta fase, mensageria entre serviços (SQS/SNS/EventBridge): o único consumidor
externo de eventos seria a observabilidade, atendida por eventos customizados do New Relic
publicados pelos próprios manipuladores (RFC 0004).

## Consequências

**Positivas**

- Poucas partes móveis; latência previsível; fácil de depurar com `x-request-id` ponta a ponta.
- O domínio continua orientado a eventos internamente; trocar o barramento por Outbox + fila
  (quando houver um segundo serviço consumidor) não altera agregados nem casos de uso.

**Negativas**

- Acoplamento temporal nas integrações externas: se o SMTP cair, o aviso ao cliente se perde
  (há alerta, não há retentativa).
- A Lambda lê a tabela `clientes` diretamente: uma mudança no schema dessa tabela afeta dois
  repositórios. Mitigação: a consulta usa apenas `id, nome, documento, ativo`, colunas estáveis
  documentadas em `modelo-de-dados.md`.

## Alternativas consideradas

- **EventBridge/SQS entre Lambda e API**: sem caso de uso real agora; adicionaria custo e
  permissões IAM indisponíveis no Learner Lab.
- **Lambda chamando a API para consultar o cliente**: cria dependência circular de disponibilidade
  (autenticação cai junto com a API) e exigiria um token de serviço.
- **gRPC entre componentes**: sem ganho para um único serviço de aplicação atrás de um gateway HTTP.
