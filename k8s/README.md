# Kubernetes — API Oficina Mecânica

Manifestos para deploy da API e do MySQL em qualquer cluster Kubernetes
(kind/minikube local ou cloud).

## Pré-requisitos

- Cluster Kubernetes (para local, veja o provisionamento com Terraform em
  [`../infra`](../infra) ou crie com `kind create cluster --name oficina`).
- `kubectl` configurado apontando para o cluster.
- **metrics-server** (necessário para o HPA):

  ```bash
  kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
  # Em kind/minikube, o kubelet usa certificado autoassinado:
  kubectl -n kube-system patch deployment metrics-server --type=json \
    -p='[{"op":"add","path":"/spec/template/spec/containers/0/args/-","value":"--kubelet-insecure-tls"}]'
  ```

## Aplicando

```bash
# 1. Namespace e configuração
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml

# 2. Segredos (copie o modelo e troque os valores)
cp k8s/secret.example.yaml k8s/secret.yaml
kubectl apply -f k8s/secret.yaml

# 3. Banco de dados
kubectl apply -f k8s/mysql.yaml
kubectl -n oficina rollout status statefulset/mysql

# 4. Migrações + seed (ajuste a imagem para o seu usuário do GHCR)
kubectl apply -f k8s/migration-job.yaml
kubectl -n oficina wait --for=condition=complete job/oficina-migracao --timeout=180s

# 5. API + Service + HPA
kubectl apply -f k8s/deployment.yaml -f k8s/service.yaml -f k8s/hpa.yaml
kubectl -n oficina rollout status deployment/oficina-api
```

## Acessando a API

```bash
kubectl -n oficina port-forward svc/oficina-api 3333:80
# http://localhost:3333/docs
```

## Demonstrando o autoescalonamento

```bash
kubectl -n oficina get hpa -w   # acompanha réplicas em um terminal

# Em outro terminal, gere carga (ex.: hey — https://github.com/rakyll/hey):
hey -z 2m -c 50 http://localhost:3333/health
```

Com a CPU acima de 70%, o HPA sobe de 2 até 5 réplicas; ao cessar a carga,
retorna ao mínimo após a janela de estabilização.

## Recursos criados

| Arquivo | Recurso |
| --- | --- |
| `namespace.yaml` | Namespace `oficina` |
| `configmap.yaml` | Config não sensível da API (`oficina-config`) |
| `secret.example.yaml` | Modelo do Secret `oficina-secrets` (chaves, senhas, SMTP) |
| `mysql.yaml` | Service + StatefulSet do MySQL com volume persistente |
| `migration-job.yaml` | Job de migração/seed do banco (roda a cada deploy) |
| `deployment.yaml` | Deployment da API (2 réplicas, probes em `/health`, requests/limits) |
| `service.yaml` | Service ClusterIP da API |
| `hpa.yaml` | HPA 2–5 réplicas por CPU (70%) e memória (80%) |
