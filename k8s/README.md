# Kubernetes — API Oficina Mecânica (EKS)

Manifestos da API organizados com **Kustomize**: uma base comum e um overlay por
ambiente. O cluster, os namespaces, o metrics-server e o API Gateway são
provisionados pelo repositório
[`oficina-infra-k8s`](https://github.com/Fabio-GST/oficina-infra-k8s); o banco
(RDS MySQL) e suas credenciais pelo
[`oficina-infra-db`](https://github.com/Fabio-GST/oficina-infra-db).

```
k8s/
  base/                 # ConfigMap, Deployment, Service (NLB interno), HPA e Job de migração
  overlays/
    hml/                # branch homolog → namespace oficina-hml (1 réplica, LOG_LEVEL=debug)
    prod/               # branch main    → namespace oficina-prod (2 réplicas, LOG_LEVEL=info)
```

| Branch    | Overlay         | Namespace      | Tag da imagem           |
| --------- | --------------- | -------------- | ----------------------- |
| `homolog` | `overlays/hml`  | `oficina-hml`  | `hml` + SHA do commit   |
| `main`    | `overlays/prod` | `oficina-prod` | `prod` + SHA do commit  |

## O que cada recurso faz

| Arquivo (base)       | Recurso                                                                                                       |
| -------------------- | ------------------------------------------------------------------------------------------------------------- |
| `configmap.yaml`     | Config não sensível (`oficina-config`): porta, log, driver de notificação, `NODE_OPTIONS` (agente New Relic) e `NEW_RELIC_APP_NAME` |
| `deployment.yaml`    | Deployment da API: probes `/health` (liveness) e `/health/ready` (readiness com banco), requests/limits        |
| `service.yaml`       | Service `type: LoadBalancer` com anotações de **NLB interno** — alvo do VPC Link do API Gateway                |
| `hpa.yaml`           | HPA 2–5 réplicas por CPU (70%) e memória (80%)                                                                 |
| `migration-job.yaml` | Job `migration:run` + `db:seed` executado a cada deploy                                                        |

O **Secret `oficina-secrets` não é versionado**: o pipeline de CD o monta a cada
deploy a partir do AWS Secrets Manager (`oficina/<ambiente>/db`: `DB_HOST`,
`DB_PORT`, `DB_DATABASE`, `DB_USER`, `DB_PASSWORD`) e dos secrets do GitHub
(`APP_KEY`, `JWT_SECRET`, `WEBHOOK_SECRET` e `NEW_RELIC_LICENSE_KEY`, opcional). Sem IRSA/External Secrets no
Learner Lab, essa é a forma de levar o segredo ao cluster sem gravá-lo no git.

## Renderizando e validando localmente

```bash
kubectl kustomize k8s/overlays/hml
```

```bash
kubectl kustomize k8s/overlays/prod | kubectl apply --dry-run=client -f -
```

## Aplicando manualmente (fora do CD)

Pré-requisito: sessão do Learner Lab ativa e credenciais no ambiente.

```bash
aws eks update-kubeconfig --region us-east-1 --name "$(aws ssm get-parameter --name /oficina/eks/nome --query Parameter.Value --output text)"
```

```bash
AMB=hml; NS=oficina-$AMB; \
SEGREDO=$(aws secretsmanager get-secret-value --secret-id oficina/$AMB/db --query SecretString --output text); \
kubectl -n $NS create secret generic oficina-secrets \
  --from-literal=DB_HOST="$(echo "$SEGREDO" | jq -r .DB_HOST)" \
  --from-literal=DB_PORT="$(echo "$SEGREDO" | jq -r .DB_PORT)" \
  --from-literal=DB_DATABASE="$(echo "$SEGREDO" | jq -r .DB_DATABASE)" \
  --from-literal=DB_USER="$(echo "$SEGREDO" | jq -r .DB_USER)" \
  --from-literal=DB_PASSWORD="$(echo "$SEGREDO" | jq -r .DB_PASSWORD)" \
  --from-literal=APP_KEY="$APP_KEY" --from-literal=JWT_SECRET="$JWT_SECRET" --from-literal=WEBHOOK_SECRET="$WEBHOOK_SECRET"   --from-literal=NEW_RELIC_LICENSE_KEY="$NEW_RELIC_LICENSE_KEY" \
  --dry-run=client -o yaml | kubectl apply -f -
```

```bash
kubectl -n oficina-hml delete job oficina-migracao --ignore-not-found; kubectl apply -k k8s/overlays/hml; kubectl -n oficina-hml wait --for=condition=complete job/oficina-migracao --timeout=300s; kubectl -n oficina-hml rollout status deployment/oficina-api --timeout=300s
```

## Acessando a API

O NLB é interno à VPC: o caminho público é a URL do API Gateway (parâmetro SSM
`/oficina/<ambiente>/gateway/url`). Para um acesso direto de diagnóstico:

```bash
kubectl -n oficina-hml port-forward svc/oficina-api 3333:80
```

## Demonstrando o autoescalonamento

```bash
kubectl -n oficina-hml get hpa -w
```

Em outro terminal, gere carga (ex.: [hey](https://github.com/rakyll/hey)) contra
a URL do gateway ou o port-forward: `hey -z 2m -c 50 http://localhost:3333/health`.
Com a CPU acima de 70%, o HPA sobe as réplicas até o máximo; ao cessar a carga,
retorna ao mínimo após a janela de estabilização.
