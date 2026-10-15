# ADR 0002 — Segregação em quatro repositórios com contratos via SSM e Secrets Manager

- **Status:** Aceito
- **Data:** 2026-10-06

## Contexto

Até a Fase 2 o projeto vivia em um único repositório (`Tech-Challenge`, pasta `backend/`),
com aplicação, manifestos Kubernetes e Terraform de um cluster local. A Fase 3 exige quatro
repositórios separados (Lambda, infraestrutura Kubernetes, infraestrutura do banco e aplicação),
cada um com CI/CD, `main` protegida, merge só por pull request e deploy automático das branches
de homologação e produção.

A dificuldade central é **como um repositório descobre o que o outro criou** (ids de VPC,
nome do cluster, endpoint do banco, id do gateway) sem acoplar os states do Terraform.

## Decisão

Quatro repositórios sob `Fabio-GST`, com **estado remoto independente** (mesmo bucket S3 e
tabela DynamoDB, uma `key` por repositório) e um **contrato de integração** publicado em
serviços gerenciados:

| Repositório | Publica | Consome |
| --- | --- | --- |
| `oficina-infra-k8s` | SSM `/oficina/vpc/*`, `/oficina/eks/*`, `/oficina/<amb>/namespace`, `/oficina/<amb>/gateway/*` | — |
| `oficina-infra-db` | SSM `/oficina/<amb>/db/*`; Secrets Manager `oficina/<amb>/db` | VPC, subnets privadas, SG dos nós |
| `oficina-auth-lambda` | SSM `/oficina/<amb>/auth/*` | VPC, subnets, SG do banco, segredo do banco, id do gateway |
| `oficina-api` | NLB (via `Service type=LoadBalancer`, descoberto por tag) | nome do cluster, namespace, segredo do banco, URL do gateway |

Regras:

1. **Nada sensível no SSM**: senhas só no Secrets Manager.
2. Cada repositório lê o contrato por `data sources` (Terraform) ou `aws ssm get-parameter`
   (pipelines); nunca `terraform_remote_state`.
3. A aplicação `oficina-api` **renomeia e herda o histórico** do repositório original (migração
   com `git subtree`/merge preservando commits), para manter os links das fases 1 e 2.
4. Em todos: branches `main` e `homolog` protegidas, PR obrigatório com CI verde, environments
   `hml` e `prod` no GitHub carregando secrets e aprovações.
5. Ordem de provisionamento: infra-k8s → infra-db → api → infra-k8s (gateway) → auth-lambda.
   Cada CD verifica no SSM os pré-requisitos antes do `apply` e falha com mensagem clara.

## Consequências

**Positivas**

- Equipes (ou pipelines) evoluem infra de rede, banco, função e aplicação em ritmos distintos.
- Um `terraform destroy` do cluster não toca no state do banco e vice-versa.
- O contrato é legível por humanos no console (`/oficina/*`), útil para depuração e para o vídeo.

**Negativas**

- Dependência de ordem: um repositório aplicado antes do outro falha cedo (por desenho).
- O gateway só pode ser criado depois que a aplicação publica o NLB, por isso existe a
  variável `habilitar_gateway` e um segundo `apply` do `oficina-infra-k8s`.
- Credenciais do Learner Lab precisam ser renovadas em quatro lugares; resolvido por script.

## Alternativas consideradas

- **Monorepo com pastas**: rejeitado por não atender ao enunciado.
- **`terraform_remote_state` entre repos**: acopla os states e exige permissão de leitura do
  bucket por todos; o SSM é mais simples e desacoplado.
- **Workspaces Terraform para hml/prod**: rejeitado em favor de um único state por repositório
  com os dois ambientes (um cluster, dois namespaces; um state, duas instâncias RDS), porque a
  branch define apenas o *environment* do GitHub (aprovações) e não o conjunto de recursos.
