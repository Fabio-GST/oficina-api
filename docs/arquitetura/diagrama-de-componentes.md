# Diagrama de componentes — visão de nuvem (Fase 3)

Como os quatro repositórios se materializam na AWS (conta Academy Learner Lab, `us-east-1`),
quem fala com quem e por onde passa a observabilidade. Cores: azul = `oficina-infra-k8s`,
verde = `oficina-infra-db`, laranja = `oficina-auth-lambda`, roxo = `oficina-api`.

```mermaid
flowchart TB
  classDef k8s fill:#dbeafe,stroke:#1d4ed8,color:#1e3a8a
  classDef db fill:#dcfce7,stroke:#15803d,color:#14532d
  classDef lambda fill:#ffedd5,stroke:#c2410c,color:#7c2d12
  classDef api fill:#ede9fe,stroke:#6d28d9,color:#4c1d95
  classDef ext fill:#f3f4f6,stroke:#6b7280,color:#111827

  U["Cliente (app / Postman)<br/>e Atendente"]:::ext
  GHA["GitHub Actions<br/>CI + CD dos 4 repositórios"]:::ext
  NR["New Relic<br/>APM · Infra K8s · Logs · Alertas"]:::ext
  SMTP["SMTP / Webhook externo"]:::ext

  subgraph AWS["AWS us-east-1"]
    GW["API Gateway HTTP<br/>oficina-hml · oficina-prod<br/>throttling · CORS · x-request-id"]:::k8s

    subgraph VPC["VPC 10.20.0.0/16 (sem NAT Gateway)"]
      subgraph PUB["Subnets públicas (2 AZs)"]
        subgraph EKS["EKS oficina · k8s 1.31 · nós t3.small (2–4, Cluster Autoscaler)"]
          subgraph NSH["namespace oficina-hml"]
            APIH["Deployment oficina-api<br/>HPA 1–5 · /health · /health/ready"]:::api
            JOBH["Job oficina-migracao<br/>migration:run + db:seed"]:::api
          end
          subgraph NSP["namespace oficina-prod"]
            APIP["Deployment oficina-api<br/>HPA 2–5"]:::api
          end
          MS["metrics-server<br/>nri-bundle (agente New Relic)"]:::k8s
        end
      end
      subgraph PRIV["Subnets privadas (2 AZs)"]
        NLBH["NLB interno hml<br/>(Service LoadBalancer)"]:::api
        NLBP["NLB interno prod"]:::api
        VL["VPC Link"]:::k8s
        LH["Lambda oficina-hml-auth-cpf<br/>nodejs22 · LabRole"]:::lambda
        LP["Lambda oficina-prod-auth-cpf"]:::lambda
        RDSH[("RDS MySQL 8<br/>oficina-hml · db.t3.micro")]:::db
        RDSP[("RDS MySQL 8<br/>oficina-prod")]:::db
      end
    end

    SSM[("SSM Parameter Store<br/>/oficina/vpc/* · /oficina/eks/*<br/>/oficina/&lt;amb&gt;/db/* · gateway/* · auth/*")]:::k8s
    SM[("Secrets Manager<br/>oficina/&lt;amb&gt;/db")]:::db
    CW["CloudWatch Logs<br/>gateway · lambda"]:::ext
    GHCR["GHCR<br/>ghcr.io/fabio-gst/oficina-api"]:::api
  end

  U -- "POST /auth/cpf" --> GW
  U -- "JWT Bearer (admin | cliente)" --> GW
  GW -- "AWS_PROXY" --> LH & LP
  GW -- "ANY /{proxy+}" --> VL
  VL --> NLBH --> APIH
  VL --> NLBP --> APIP
  LH -- "3306 (SG→SG)" --> RDSH
  LP -- "3306" --> RDSP
  APIH & JOBH -- "3306" --> RDSH
  APIP -- "3306" --> RDSP
  APIH & APIP -- "e-mail / webhook de orçamento" --> SMTP

  GHA -- "terraform apply · kubectl apply -k" --> AWS
  GHA -- "docker push" --> GHCR
  GHCR -. "pull" .-> APIH & APIP
  GHA -. "lê contrato" .-> SSM
  GHA -. "lê credenciais → Secret oficina-secrets" .-> SM

  APIH & APIP -- "agente newrelic + pino enricher" --> NR
  MS -- "CPU/memória/pods" --> NR
  GW & LH & LP -- "logs JSON" --> CW
```

## Componentes por repositório

| Repositório | Componentes na figura | Contrato publicado |
| --- | --- | --- |
| [`oficina-infra-k8s`](https://github.com/Fabio-GST/oficina-infra-k8s) | VPC, subnets, EKS, node group, metrics-server, Cluster Autoscaler, namespaces, API Gateway + VPC Link, agente New Relic do cluster | SSM `/oficina/vpc/*`, `/oficina/eks/*`, `/oficina/<amb>/namespace`, `/oficina/<amb>/gateway/*` |
| [`oficina-infra-db`](https://github.com/Fabio-GST/oficina-infra-db) | RDS por ambiente, security groups, parameter group, Secrets Manager | SSM `/oficina/<amb>/db/*`; segredo `oficina/<amb>/db` |
| [`oficina-auth-lambda`](https://github.com/Fabio-GST/oficina-auth-lambda) | Lambda por ambiente, SG, regra 3306 no SG do banco, rota `POST /auth/cpf`, Function URL | SSM `/oficina/<amb>/auth/*` |
| **`oficina-api`** (este) | Deployment + HPA + Service (NLB) + ConfigMap + Secret + Job de migração via Kustomize; imagem no GHCR | NLB descoberto por tag `kubernetes.io/service-name` |

## Fluxos principais

1. **Autenticação por CPF**: cliente → gateway → Lambda → RDS (`clientes.documento`, `ativo`) →
   JWT HS256 (`papel: cliente`). Detalhe em [diagrama de sequência](./diagrama-de-sequencia.md).
2. **Chamada autenticada**: cliente/atendente → gateway (`x-request-id`) → VPC Link → NLB →
   pod da API → `AutenticacaoMiddleware` + `PapelMiddleware` → caso de uso → RDS → eventos de
   domínio → Políticas (e-mail, estoque, pagamento) → New Relic.
3. **Deploy**: push em `homolog`/`main` → CI → CD: imagem no GHCR, kubeconfig via SSM, Secret a
   partir do Secrets Manager, `kubectl apply -k overlays/<amb>`, Job de migração, `rollout`,
   smoke test pela URL do gateway.
4. **Observabilidade**: APM e logs com `trace.id` da API, métricas de pods/nós do cluster,
   logs do gateway e da Lambda no CloudWatch; dashboards e alertas na RFC 0004.

## Decisões relacionadas

RFC 0001 (nuvem), RFC 0002 (banco), RFC 0003 (autenticação), RFC 0004 (observabilidade);
ADR 0002 (quatro repositórios), ADR 0003 (gateway), ADR 0004 (HPA), ADR 0005 (comunicação),
ADR 0006 (migrações).
