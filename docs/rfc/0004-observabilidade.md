# RFC 0004 — Observabilidade: New Relic com logs JSON correlacionados

- **Status:** Aceita (implementação do agente em andamento)
- **Data:** 2026-10-06
- **Decide:** a plataforma de monitoramento, o que é monitorado, como os logs são correlacionados
  e quais dashboards e alertas são entregues.

## Contexto

O enunciado exige integração com Datadog, New Relic ou similar, monitorando latência das APIs,
consumo de CPU/memória do Kubernetes, healthchecks e uptime, alertas para falhas no
processamento de OS e logs estruturados em JSON com correlação entre requisições; e dashboards
com volume diário de OS, tempo médio por status e erros nas integrações.

A API já tem logger **pino** (JSON em produção), um endpoint de métrica de negócio
(`GET /metrics/average-execution-time`) e eventos de domínio (`ordem-servico.*`) publicados
em um barramento in-process (ADR 0001).

## Opções consideradas

| Critério | New Relic | Datadog | Grafana Cloud (Prometheus + Loki + Tempo) |
| --- | --- | --- | --- |
| Plano gratuito | permanente: 100 GB/mês, 1 usuário full | trial de 14 dias; depois pago por host | permanente: 10k séries, 50 GB logs |
| APM Node.js | agente `newrelic` (auto-instrumenta HTTP, MySQL, pino) | `dd-trace` | OpenTelemetry manual |
| Kubernetes | `nri-bundle` via Helm (CPU, memória, pods, eventos) | agent Helm | kube-state-metrics + Alloy |
| Logs com `trace.id` | `@newrelic/pino-enricher` | `dd-trace` injeta ids no pino | Loki + exemplars (manual) |
| Alertas e dashboards | incluídos (NRQL) | incluídos | incluídos |
| Precisa de IAM/IRSA no EKS | não (license key em Secret) | não | não |
| Esforço de integração | baixo | baixo | alto |

## Decisão

**New Relic** (free tier permanente). Instrumentação em três camadas:

| Camada | Como | Cobre |
| --- | --- | --- |
| **APM da API** | pacote `newrelic` carregado antes da aplicação (`NODE_OPTIONS=-r newrelic`), `NEW_RELIC_LICENSE_KEY` via Secret `oficina-secrets`, `NEW_RELIC_APP_NAME=oficina-api-<amb>` | latência por rota, throughput, erros, traces distribuídos, consultas MySQL |
| **Infra do Kubernetes** | Helm `nri-bundle` (kube-state-metrics + infra agent) no repo `oficina-infra-k8s` | CPU/memória por pod e nó, réplicas do HPA, reinícios, eventos |
| **Logs em contexto** | pino em JSON com `requestId` (middleware de correlação) e `@newrelic/pino-enricher` adicionando `trace.id`/`span.id`; coleta via `newrelic-logging` do bundle | correlação requisição → log → trace |

**Lambda**: logs JSON no CloudWatch com `requestId` do API Gateway; métricas de invocação,
erros e duração nativas do Lambda, integradas ao New Relic pela extensão `newrelic-lambda` como
evolução (a camada exige configurar o CloudWatch Metric Streams, que depende de role IAM).

### Correlação entre requisições

1. O API Gateway grava `x-request-id = $context.requestId` na requisição para a API (e a Lambda
   recebe o mesmo id em `requestContext.requestId`).
2. `CorrelacaoMiddleware` aceita o header ou gera um id, cria um child logger com `requestId` e
   devolve `x-request-id` na resposta.
3. O enricher adiciona `trace.id` do New Relic a cada linha; no painel, um `trace.id` reúne
   requisição, consultas SQL e logs.

### Dashboards exigidos

| Painel | Fonte |
| --- | --- |
| Latência das APIs (p50/p95 por rota) | APM `Transaction` |
| CPU/memória dos pods e nós, réplicas do HPA | `K8sContainerSample`, `K8sPodSample` |
| Healthcheck e uptime | Synthetics ping em `GET {gateway}/health` a cada 5 min |
| **Volume diário de OS** | evento customizado `OrdemServicoCriada` (gravado no manipulador de `ordem-servico.aberta`) |
| **Tempo médio por status** (Diagnóstico, Execução, Finalização) | evento `OrdemServicoMudouStatus { de, para, duracaoMs }` a cada transição, derivado de `historico_status_os` |
| **Erros e falhas nas integrações** | evento `IntegracaoFalhou { integracao: 'email' \| 'webhook', erro }` + erros do APM |

### Alertas

| Condição | Limiar | Por quê |
| --- | --- | --- |
| Taxa de erro em `/work-orders/*` e `/me/work-orders/*` | > 5 % em 5 min | "falhas no processamento de ordens de serviço" |
| `IntegracaoFalhou` | ≥ 1 em 5 min | e-mail ou webhook de orçamento indisponível |
| Apdex da API | < 0,7 por 10 min | degradação de latência |
| Pods em `CrashLoopBackOff` ou réplicas disponíveis < 2 | 5 min | disponibilidade |
| Synthetics `/health` | 2 falhas consecutivas | uptime |

## Por que não as outras

- **Datadog**: integração equivalente, mas o trial de 14 dias não cobre o período de avaliação
  e a cobrança por host inviabiliza a conta de estudante.
- **Grafana Cloud**: free tier generoso e padrão aberto (OpenTelemetry), mas exige montar e
  manter três pipelines (métricas, logs, traces) e instrumentar manualmente; o esforço não cabe
  na fase.

## Consequências

- Dependência de um SaaS externo com license key em Secret; sem IAM envolvido, cabe no Learner
  Lab.
- Os eventos de negócio para dashboard são publicados pelos manipuladores de eventos de domínio
  já existentes (ADR 0001), sem tocar nos agregados.
- Implementação: agente e enricher na API, `nri-bundle` no repo `oficina-infra-k8s`, dashboards
  e alertas criados no painel do New Relic e exportados como JSON em `docs/observabilidade/`.
