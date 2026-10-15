# ADR 0006 — Migrações de schema pertencem à aplicação; o repositório do banco provisiona e documenta

- **Status:** Aceito
- **Data:** 2026-10-06

## Contexto

Com o banco em repositório próprio (`oficina-infra-db`), surge a dúvida de onde ficam as
migrações de schema (Lucid), os seeds e a documentação do modelo de dados. O repositório do
banco é Terraform; a aplicação é quem conhece as tabelas.

## Decisão

| Responsabilidade | Repositório | Mecanismo |
| --- | --- | --- |
| Provisionar a instância, rede, credenciais, backups, parameter group | `oficina-infra-db` | Terraform |
| **Documentar** o modelo (ER, relacionamentos, justificativa, ajustes propostos) | `oficina-infra-db` (`docs/modelo-de-dados.md`) | Markdown + Mermaid, fonte única; a API linka |
| **Evoluir o schema** (migrações) e popular dados de demonstração (seeds) | `oficina-api` | Lucid; `Job oficina-migracao` executado pelo CD antes do `rollout` |
| Ajustes de índice/constraint propostos na documentação | `oficina-api` | viram migrações numeradas, com link para o item da documentação |

Regras:

1. Toda mudança de schema entra por **migração versionada** na aplicação, revisada no mesmo PR
   que o código que a usa (ex.: `…012_add_ativo_to_clientes_table` junto do `papel` no JWT).
2. O Job de migração roda **uma vez por deploy**, antes do `rollout status`, com a imagem do
   mesmo `sha`; falha de migração aborta o deploy.
3. O Terraform do banco **nunca** executa SQL de aplicação (também não alcança o banco em
   subnets privadas a partir do runner).
4. A Lambda **não** migra nada: consome colunas estáveis de `clientes` documentadas no modelo.

## Consequências

**Positivas**

- Schema e código evoluem atomicamente; o histórico de migrações conta a história do domínio.
- O repositório do banco permanece pequeno, declarativo e sem dependência do Node.

**Negativas**

- A documentação do modelo pode defasar em relação às migrações; mitigação: o PR que adiciona
  uma migração atualiza (ou linka) o `modelo-de-dados.md`.
- Migrações destrutivas em produção exigem disciplina (expandir → migrar dados → contrair); sem
  snapshot automático antes do Job no Learner Lab.

## Alternativas consideradas

- **Migrações no repositório do banco** (Flyway/Liquibase): separa infra de código, mas exigiria
  um runner com acesso à VPC e duplicaria o conhecimento do schema que o Lucid já tem.
- **`terraform` + provider `mysql`**: DDL em HCL é pobre e o runner não alcança o banco.
- **Migração no boot da aplicação** (Fase 1): corrida entre réplicas; o Job separado é mais seguro.
