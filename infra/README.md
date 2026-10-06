# Terraform — Infraestrutura da Oficina

Provisiona a infraestrutura local com **kind** (Kubernetes in Docker):

| Recurso | Descrição |
| --- | --- |
| `kind_cluster.oficina` | Cluster Kubernetes local (1 control-plane + 1 worker) |
| `kubernetes_namespace_v1.oficina` | Namespace `oficina` |
| `kubernetes_secret_v1.oficina_secrets` | Secret `oficina-secrets` (chaves da API, senha do banco, SMTP) |
| `kubernetes_service_v1.mysql` + `kubernetes_stateful_set_v1.mysql` | Banco MySQL 8 com volume persistente |

Os manifestos **da aplicação** (Deployment, Service, HPA, Job de migração)
ficam em [`../k8s`](../k8s) e são aplicados pelo pipeline de CD (ou
manualmente) sobre esta base. Quem provisiona por Terraform **não** deve
aplicar `k8s/mysql.yaml` nem `k8s/secret.yaml` (já criados aqui).

## Pré-requisitos

- [Terraform](https://developer.hashicorp.com/terraform/downloads) >= 1.5
- Docker em execução (o kind cria os nós como containers)

## Como aplicar

```bash
cd infra
cp terraform.tfvars.example terraform.tfvars   # troque os valores!

terraform init
terraform plan
terraform apply
```

Ao final, o contexto `kind-oficina` fica disponível no kubectl:

```bash
kubectl config use-context kind-oficina
kubectl -n oficina get pods
```

Depois, instale o metrics-server e aplique os manifestos da aplicação
seguindo [`../k8s/README.md`](../k8s/README.md) (pulando namespace, secret e
mysql, já criados aqui).

## Destruindo

```bash
terraform destroy
```

## Evolução para cloud

A mesma estrutura migra para cloud trocando o recurso do cluster
(`kind_cluster` → EKS/AKS/GKE) e o banco (StatefulSet → RDS/Cloud SQL);
namespace, secret e os manifestos de `../k8s` permanecem válidos.
