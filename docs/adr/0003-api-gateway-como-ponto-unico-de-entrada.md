# ADR 0003 — API Gateway HTTP como ponto único de entrada (VPC Link → NLB interno)

- **Status:** Aceito
- **Data:** 2026-10-06

## Contexto

A Fase 3 exige um API Gateway para controle e roteamento, na frente da aplicação no Kubernetes
e da Function Serverless de autenticação. No Learner Lab não é possível instalar o AWS Load
Balancer Controller (exige IRSA), o que descarta `Ingress` com ALB.

## Decisão

Um **Amazon API Gateway HTTP API por ambiente** (`oficina-hml`, `oficina-prod`), criado pelo
repositório `oficina-infra-k8s`, com duas integrações:

| Rota | Integração | Destino |
| --- | --- | --- |
| `POST /auth/cpf` | `AWS_PROXY` (payload v2) | Lambda `oficina-<amb>-auth-cpf` (adicionada pelo repo `oficina-auth-lambda`) |
| `ANY /` e `ANY /{proxy+}` | `HTTP_PROXY` via **VPC Link** | **NLB interno** criado pelo `Service type=LoadBalancer` da API no namespace do ambiente |

A rota mais específica (`/auth/cpf`) tem precedência sobre o proxy. O gateway grava
`x-request-id = $context.requestId` na requisição para a API, aplica throttling (50 req/s,
burst 100), CORS e logs de acesso em JSON no CloudWatch.

O NLB é **interno** (subnets privadas) e descoberto pelo Terraform pela tag
`kubernetes.io/service-name=<namespace>/oficina-api`, sem controller adicional: o
cloud-controller nativo do EKS o provisiona com a permissão da `LabRole` dos nós.

## Consequências

**Positivas**

- Uma URL por ambiente para clientes, Postman e vídeo; a API não fica exposta diretamente.
- Autenticação (Lambda) e aplicação (EKS) convivem sob o mesmo domínio e o mesmo id de
  correlação.
- Throttling e logs de acesso centralizados sem código na aplicação.

**Negativas**

- Dependência de ordem: o gateway só é criado depois que a API publica o NLB
  (`habilitar_gateway = true` em um segundo `apply`).
- HTTP API não suporta WAF nem *usage plans*; para isso seria REST API (mais caro) ou CloudFront.
- O VPC Link adiciona ~ms de latência e um security group extra.

## Alternativas consideradas

- **Kong/Traefik dentro do EKS**: flexíveis e portáveis, mas exigiriam expor um NLB público e
  gerir mais um componente; a Lambda ficaria fora do gateway.
- **ALB via AWS Load Balancer Controller**: bloqueado pelo Learner Lab (IRSA).
- **Expor o NLB público sem gateway**: não atende ao requisito nem integra a Lambda.
- **Lambda authorizer no gateway**: possível complemento futuro; a validação do JWT permanece
  na API (RFC 0003).
