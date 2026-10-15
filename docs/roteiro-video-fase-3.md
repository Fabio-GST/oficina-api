# Roteiro do vídeo — Fase 3 (até 15 minutos)

Demonstrar os seis itens exigidos: autenticação com CPF, execução da pipeline CI/CD, deploy
automatizado, consumo das APIs protegidas, dashboard de monitoramento ao vivo, logs e traces.

## Preparação (antes de gravar)

- [ ] *Start Lab*; rodar `scripts/atualizar-credenciais-aws.sh` (repo `oficina-infra-k8s`).
- [ ] Repos 2 e 3 aplicados (`terraform output` ok); API em `oficina-hml`; gateway habilitado
      (`HABILITAR_GATEWAY=true` nos repos 2 e 1); Lambda aplicada.
- [ ] `GATEWAY=$(aws ssm get-parameter --name /oficina/hml/gateway/url --query Parameter.Value --output text)`
- [ ] Postman com a collection importada de `docs/openapi.json` e variável `{{gateway_url}}`.
- [ ] New Relic aberto: dashboard "Oficina — Operação" e a lista de alertas; `kubectl get hpa -w`
      em um terminal; gerador de carga pronto (`hey -z 60s -c 20 $GATEWAY/health`).
- [ ] Uma mudança trivial preparada em uma branch da `oficina-api` (ex.: texto do `GET /`) para
      abrir PR ao vivo.

## Cena a cena

| # | Tempo | Cena | O que mostrar | Fala-chave |
| --- | --- | --- | --- | --- |
| 1 | 0:00–1:00 | Abertura | Diagrama de componentes (`docs/arquitetura/diagrama-de-componentes.md`); os 4 repositórios no GitHub | "Quatro repositórios, um contrato via SSM/Secrets Manager, conta AWS Academy com LabRole" |
| 2 | 1:00–2:30 | Infra como código | Console AWS: EKS `oficina`, RDS `oficina-hml`, API Gateway `oficina-hml`, Lambda `oficina-hml-auth-cpf`; `terraform output` dos repos 2 e 3 | "Tudo provisionado por Terraform com state em S3; nós em subnets públicas sem NAT para caber no crédito" |
| 3 | 2:30–4:30 | **Autenticação com CPF** | Postman: `POST {{gateway_url}}/auth/cpf` com `111.444.777-35` → 200 + token; `123.456.789-09` → 403 inativo; `111.444.777-36` → 400 | "A Lambda valida dígitos, consulta `clientes.ativo` no RDS e assina o JWT com o mesmo segredo da API" |
| 4 | 4:30–6:30 | **APIs protegidas** | Com o token de cliente: `GET /me/work-orders`, `GET /me/work-orders/{id}`, `POST .../approval` → `EM_EXECUCAO`; tentar `GET /customers` → 403. Login admin e `POST /work-orders` → 201 | "Dois papéis, um middleware; o cliente só enxerga as próprias OS e o id vem do token, não da URL" |
| 5 | 6:30–9:00 | **Pipeline CI/CD e deploy** | Abrir PR na `oficina-api` → CI (lint, testes, build, kustomize) → merge em `homolog` → CD: imagem no GHCR, Secret do Secrets Manager, `kubectl apply -k`, Job de migração, `rollout`, smoke test pelo gateway; `kubectl get pods -n oficina-hml` mostrando a troca de réplicas | "Branch `homolog` → namespace hml; `main` → prod com aprovação; `main` protegida, só PR" |
| 6 | 9:00–10:00 | Escalabilidade | `hey` contra o gateway; `kubectl get hpa -w` subindo réplicas; New Relic K8s mostrando CPU | "HPA por CPU e memória; Cluster Autoscaler no node group" |
| 7 | 10:00–12:30 | **Dashboard ao vivo** | New Relic: latência p95 por rota, CPU/memória dos pods, volume diário de OS, tempo médio por status, falhas de integração; disparar uma falha de e-mail (SMTP inválido) e ver o alerta `IntegracaoFalhou` | "Métricas de negócio vêm dos eventos de domínio já existentes" |
| 8 | 12:30–14:00 | **Logs e traces** | Copiar o `x-request-id` de uma resposta do Postman; New Relic Logs filtrando por `requestId` → `trace.id` → transação APM com a consulta MySQL; CloudWatch da Lambda com o mesmo requestId e CPF mascarado | "Correlação ponta a ponta: gateway → API → banco, e Lambda com o mesmo id" |
| 9 | 14:00–15:00 | Encerramento | RFCs/ADRs em `docs/`, ER em `oficina-infra-db/docs/modelo-de-dados.md`, `soat-architecture` nos 4 repos; `terraform destroy` agendado | "Decisões registradas; infra destruída ao fim da sessão para poupar crédito" |

## Dicas de gravação

- Gravar em 1080p com o terminal em fonte ≥ 16 pt; zoom no Postman.
- Deixar o CD do passo 5 **já em execução** ao começar a cena, para não esperar o build (≈ 3 min);
  mostrar o início e depois o resultado.
- Se o New Relic demorar a ingerir, gerar carga durante a cena 5 para que a cena 7 já tenha dados.
- Cortar pausas na edição; o limite de 15 minutos é rígido.
