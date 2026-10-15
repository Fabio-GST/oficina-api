# RFC 0002 — Banco de dados gerenciado: Amazon RDS for MySQL 8

- **Status:** Aceita
- **Data:** 2026-10-06
- **Decide:** qual banco gerenciado substitui o MySQL em `StatefulSet` da Fase 2 e por quê o
  modelo relacional é mantido.

## Contexto

Na Fase 2 o MySQL rodava dentro do cluster kind, em um `StatefulSet` com volume local: sem
backup automático, sem patching, preso a um nó. A Fase 3 exige um **banco de dados gerenciado**
(PostgreSQL, MySQL, SQL Server etc.) provisionado por Terraform em repositório próprio, com
justificativa formal e revisão do modelo relacional.

O domínio é **transacional e relacional**: Ordem de Serviço ↔ cliente ↔ veículo ↔ itens ↔
estoque ↔ pagamento. Dois requisitos funcionais pesam diretamente:

1. Reservar/baixar estoque e gravar a OS devem ser **atômicos** (Unidade de Trabalho).
2. A fila de OS é ordenada por **status e antiguidade**, excluindo finalizadas e entregues.

## Opções consideradas

| Critério | RDS MySQL 8 | RDS PostgreSQL 16 | Aurora Serverless v2 | DynamoDB |
| --- | --- | --- | --- | --- |
| Reaproveita Lucid + 11 migrações + seeds da Fase 2 | **sim, sem alteração** | quase (ajustes de tipos/`CHECK`) | sim (compatível MySQL) | não — reescrita total |
| Transações ACID multi-tabela | sim | sim | sim | limitadas (25 itens) |
| FKs, `ON DELETE`, índices compostos | sim | sim | sim | não |
| Custo no Learner Lab | `db.t3.micro` ≈ US$ 0,017/h (free tier) | igual | mínimo 0,5 ACU ≈ US$ 0,06/h | pay-per-request, barato |
| Consulta "fila por status" | índice `(status, created_at)` | igual | igual | exige GSI por status e scatter |
| Operação no lab | sem Enhanced Monitoring (role IAM) | igual | igual | n/a |
| Conhecimento da equipe | alto | médio | alto | baixo |

## Decisão

**Amazon RDS for MySQL 8.0**, uma instância `db.t3.micro` por ambiente (`oficina-hml`,
`oficina-prod`), nas subnets privadas da VPC do projeto, com storage gp3 criptografado, backups
automáticos (1 dia em hml, 7 em prod), parameter group `utf8mb4` / `utf8mb4_0900_ai_ci` / UTC
e acesso restrito por security group aos nós do EKS e à Lambda.

Credenciais geradas pelo Terraform e entregues via **Secrets Manager** (`oficina/<amb>/db`);
endpoint e identificadores via **SSM Parameter Store** (`/oficina/<amb>/db/*`).

### Por que relacional

Chaves estrangeiras garantem que não exista OS sem cliente nem item sem OS; transações
garantem que estoque e OS nunca fiquem inconsistentes entre si; `JOIN`s resolvem os relatórios
do dashboard (volume por dia, tempo por status) sem duplicar dados. Um banco de documentos
exigiria desnormalizar o estoque dentro da OS ou compensações manuais.

### Por que MySQL e não PostgreSQL

Tecnicamente equivalentes para este domínio. O fator decisivo é o **custo de migração zero**:
Lucid, migrações, seeds, testes e o adaptador `mysql2` da Lambda já funcionam. PostgreSQL
traria `CHECK` mais antigo e tipos melhores, mas nenhum requisito do projeto depende disso.

### Por que gerenciado e não StatefulSet

Backups, patching, criptografia, métricas e isolamento de rede sem código operacional. É também
o único jeito de a Lambda (fora do cluster) alcançar o banco sem expor um `Service` do
Kubernetes.

## Ajustes no modelo relacional

Levantados na revisão e documentados com o diagrama ER em
[`oficina-infra-db/docs/modelo-de-dados.md`](https://github.com/Fabio-GST/oficina-infra-db/blob/main/docs/modelo-de-dados.md):

| Ajuste | Motivo | Estado |
| --- | --- | --- |
| `clientes.ativo` | A Function Serverless consulta existência **e status** antes de emitir o JWT | **feito** (migração `…012`) |
| FK + `UNIQUE` em `pagamentos.ordem_id` | Hoje aceita OS inexistente e dois pagamentos por OS | proposto |
| Índice `ordens_servico (status, created_at)` | Fila ordenada por status e antiguidade sem full scan | proposto |
| Índice `ordens_servico (cliente_id, created_at)` | Portal do cliente (`GET /me/work-orders`) | proposto |
| Índices em `historico_status_os` | Dashboards de tempo por status e volume diário | proposto |
| `CHECK` em `pecas` e `itens_ordem_servico` | Invariantes do estoque fora do caso de uso | proposto |

## Consequências

- Migrações continuam no repositório da aplicação (ADR 0006); o repositório do banco só
  provisiona e documenta.
- Single-AZ e sem proteção contra exclusão são escolhas de laboratório; em produção, Multi-AZ,
  `deletion_protection`, snapshot final e rotação automática de senha.
- A Lambda usa o usuário mestre por limitação do lab (sem alcance do Terraform ao banco para
  `CREATE USER`); evolução: usuário somente leitura em `clientes` criado pelo job de migração.
