# RFC 0001 — Escolha da nuvem: AWS (conta AWS Academy Learner Lab)

- **Status:** Aceita
- **Data:** 2026-10-06
- **Autores:** equipe do Tech Challenge (13SOAT)
- **Decide:** em qual provedor de nuvem rodam o cluster Kubernetes, o banco gerenciado, o API
  Gateway e a Function Serverless exigidos pela Fase 3, e sob quais restrições.

## Contexto

A Fase 3 exige, com livre escolha de nuvem: API Gateway, Function Serverless para autenticação,
banco de dados gerenciado, cluster Kubernetes com escalabilidade e provisionamento com
Terraform, em quatro repositórios com deploy automático. O grupo não tem conta paga em nenhum
provedor; tem acesso ao **AWS Academy Learner Lab** pela instituição, com crédito limitado
(US$ 50–100 por curso) e permissões restritas.

## Opções consideradas

| Critério | AWS (Learner Lab) | GCP (free trial) | Azure (for Students) |
| --- | --- | --- | --- |
| Kubernetes gerenciado | EKS (US$ 0,10/h control plane) | GKE Autopilot (1 cluster zonal grátis) | AKS (control plane grátis) |
| Serverless + gateway | Lambda + API Gateway HTTP (free tier) | Cloud Functions + API Gateway | Functions + APIM (APIM caro) |
| Banco gerenciado | RDS MySQL `db.t3.micro` (free tier 12 meses) | Cloud SQL (sem free tier) | Azure Database for MySQL Flexible |
| Terraform | provider maduro, módulos `terraform-aws-modules` | maduro | maduro |
| Acesso do grupo | **já disponível** via Academy | exige cartão de crédito | exige verificação acadêmica |
| Restrições | sem criar IAM roles/OIDC, credenciais expiram por sessão | nenhuma relevante | nenhuma relevante |
| Aderência ao enunciado | exemplo literal do enunciado (API Gateway, Lambda) | boa | boa |

## Decisão

**AWS**, usando a conta **AWS Academy Learner Lab**, região `us-east-1`. Mapeamento 1:1 com os
quatro repositórios: `oficina-infra-k8s` (VPC, EKS, API Gateway), `oficina-infra-db` (RDS
MySQL), `oficina-auth-lambda` (Lambda) e `oficina-api` (aplicação no EKS).

Fatores decisivos: acesso imediato sem cartão de crédito, aderência literal ao exemplo do
enunciado e maturidade do ecossistema Terraform.

## Consequências das restrições do Learner Lab

| Restrição | Efeito no projeto |
| --- | --- |
| Não cria roles, policies, users nem OIDC providers | Tudo usa a **`LabRole`** existente: cluster e node group do EKS, Lambda. Sem IRSA, sem External Secrets Operator, sem AWS Load Balancer Controller. O GitHub Actions autentica com as credenciais temporárias do lab em vez de OIDC. |
| Credenciais expiram a cada sessão (~4 h) | Script `atualizar-credenciais-aws.sh` renova os secrets `AWS_*` dos 4 repositórios após cada *Start Lab*. Os pipelines pulam o `plan` quando os secrets estão ausentes, em vez de falhar. |
| Sessão termina → instâncias param, crédito limitado | Fluxo "`apply` no início da sessão, `destroy` no fim" para EKS e RDS; estado remoto em S3 + DynamoDB para reproduzir. Sem NAT Gateway (nós do EKS em subnets públicas), 2 × `t3.small`, um cluster com namespaces `oficina-hml` e `oficina-prod`. |
| Enhanced Monitoring do RDS exige role | Desligado; métricas básicas do CloudWatch continuam. |
| Lambda na VPC sem NAT não acessa o Secrets Manager | Credenciais injetadas como variáveis de ambiente pelo Terraform (lidas do Secrets Manager no `apply`). |

Essas adaptações são **decisões de laboratório**, não de produção. Cada README registra a
versão de produção correspondente (OIDC para o CI, IRSA, Multi-AZ, NAT ou VPC endpoints).

## Alternativas rejeitadas

- **GCP**: o GKE Autopilot gratuito seria mais barato, mas exige cartão de crédito e afasta o
  projeto do vocabulário do enunciado. Rejeitada pelo acesso.
- **Azure**: AKS sem custo de control plane, mas API Management é caro e a verificação
  estudantil atrasaria o início. Rejeitada pelo prazo.
- **Conta AWS pessoal**: evitaria todas as restrições do lab, mas expõe um integrante a custos
  imprevisíveis. Rejeitada por risco financeiro.

## Referências

- [`oficina-infra-k8s/README.md`](https://github.com/Fabio-GST/oficina-infra-k8s) — adaptações ao Learner Lab e custo estimado por hora.
- ADR 0002 — Segregação em quatro repositórios.
