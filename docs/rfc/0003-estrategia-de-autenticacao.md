# RFC 0003 — Estratégia de autenticação: CPF via Function Serverless e JWT HS256 compartilhado

- **Status:** Aceita
- **Data:** 2026-10-06
- **Decide:** como o cliente da oficina se autentica por CPF, quem emite o token, como a API o
  valida e como convive com a autenticação do administrador já existente.

## Contexto

O enunciado exige proteger rotas sensíveis com **autenticação via CPF**, implementada por uma
**Function Serverless** que valida o CPF, consulta existência e status do cliente no banco e
devolve um **JWT** aceito pelas APIs protegidas, atrás de um API Gateway.

A API já possuía autenticação de **administrador** (e-mail e senha) com JWT HS256 emitido por
`ServicoJwt` e verificado pelo `AutenticacaoMiddleware`. O cliente não tem senha: seu
identificador é o CPF, já armazenado em `clientes.documento` com validação de dígitos
verificadores pelo objeto de valor `Documento`.

## Opções consideradas

| Critério | A. Lambda emite JWT **HS256** com segredo compartilhado | B. Lambda emite JWT **RS256**, API valida com chave pública | C. Amazon **Cognito** (custom auth com CPF) | D. **Lambda authorizer** no gateway, API sem verificar |
| --- | --- | --- | --- | --- |
| Reaproveita `ServicoJwt` e middleware | sim, inalterado | troca de algoritmo e chave | não; novo fluxo OIDC | sim, mas API fica cega |
| Segredo | um `JWT_SECRET` nos dois serviços | chave privada só na Lambda | gerenciado pela AWS | n/a |
| Risco se a API vazar o segredo | pode forjar tokens | não pode (só verifica) | não | — |
| Viável no Learner Lab | sim | sim | user pools sim; triggers exigem roles | sim |
| Defesa em profundidade | API valida cada requisição | idem | idem | só o gateway valida; chamadas internas passam |
| Complexidade | baixa | média (gestão de chaves, JWKS) | alta | média |

## Decisão

**Opção A**: a Function `oficina-auth-lambda` emite JWT **HS256** com o mesmo `JWT_SECRET` da
API. A API continua verificando **todo** token no `AutenticacaoMiddleware` (defesa em
profundidade, independentemente do gateway) e passa a distinguir **papéis**:

| Papel | Emissor | Credencial | Claims | Rotas |
| --- | --- | --- | --- | --- |
| `admin` | `oficina-api` (`POST /auth/login`) | e-mail + senha | `sub`, `nome`, `email`, `papel` | administrativas |
| `cliente` | `oficina-auth-lambda` (`POST /auth/cpf`) | CPF | `sub` (id do cliente), `cpf`, `papel`, `iat`, `exp` | portal do cliente (`/me/*`) |

Fluxo da Function: normalizar e validar os dígitos do CPF → `SELECT id, nome, documento, ativo
FROM clientes WHERE documento = ?` → `400` inválido, `401` inexistente, `403` inativo, `200`
com `{ token, tipo: "Bearer", expiraEm, cliente }`. Validade de **1 hora**.

### Contrato entre os repositórios

O formato do token é um **contrato testado dos dois lados**: `tests/unit/contrato-jwt.spec.ts`
na API e `tests/jwt.spec.ts` na Lambda verificam algoritmo, segredo e o conjunto exato de claims.
O segredo é o **mesmo secret `JWT_SECRET`** dos environments `hml`/`prod` dos dois repositórios
no GitHub.

### Autorização por papel

`PapelMiddleware` lê `papel` do token verificado e nega (`403`) quem não estiver na lista da rota.
As rotas do portal do cliente usam **sempre a claim `sub`** como id do cliente, nunca a URL; uma
OS de outro cliente responde `404` sem revelar existência.

## Por que não as outras

- **B (RS256)**: mais seguro se a API for comprometida, mas o projeto tem um só emissor por papel
  e os dois serviços estão sob o mesmo controle. Fica registrada como **evolução recomendada**:
  trocar `ServicoJwt` para verificar com chave pública (JWKS publicado pela Lambda) não altera
  domínio nem rotas.
- **C (Cognito)**: resolve senha, MFA e rotação, mas o requisito é autenticar **só por CPF**, sem
  senha; os triggers de custom auth precisam de roles IAM, bloqueadas no Learner Lab.
- **D (authorizer no gateway)**: pode ser adicionado depois como primeira barreira, mas nunca
  substituir a verificação na API.

## Consequências e riscos aceitos

- CPF sozinho é um fator fraco: qualquer pessoa com o CPF de um cliente ativo obtém um token.
  Mitigações adotadas: validade curta, throttling do API Gateway (50 req/s), logs com CPF
  mascarado, acesso limitado ao próprio portal (`/me/*`, sem ações administrativas). Evolução:
  segundo fator por e-mail/SMS, ou Cognito.
- `401` e `403` distintos revelam se um CPF está cadastrado. Aceito para a demonstração;
  em produção ambos colapsariam em `401`.
- O segredo compartilhado é injetado como variável de ambiente na Lambda (sem acesso ao Secrets
  Manager pela VPC sem NAT). Evolução: VPC endpoint + leitura em tempo de execução.

## Referências

- [`oficina-auth-lambda/README.md`](https://github.com/Fabio-GST/oficina-auth-lambda) — contrato do endpoint e diagrama de sequência.
- [Diagrama de sequência da autenticação](../arquitetura/diagrama-de-sequencia.md).
