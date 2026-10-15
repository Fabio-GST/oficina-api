# Observabilidade — New Relic (RFC 0004)

Implementação da [RFC 0004](../rfc/0004-observabilidade.md): APM da API, infraestrutura do
Kubernetes, logs JSON correlacionados por `trace.id` e eventos de negócio para os dashboards e
alertas exigidos pelo Tech Challenge.

| Arquivo                                              | Conteúdo                                                                            |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------- |
| [`dashboard-oficina.json`](./dashboard-oficina.json) | Dashboard completo para **importar** no New Relic (Dashboards → _Import dashboard_) |
| [`alertas.md`](./alertas.md)                         | NRQL e limiares das 5 condições de alerta da RFC                                    |

## Como os dados chegam ao New Relic

| Camada                  | Onde está                                                                                       | O que envia                                                                                      |
| ----------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| **APM da API**          | `newrelic.cjs` + `NODE_OPTIONS="-r newrelic --import newrelic/esm-loader.mjs"` (ConfigMap)      | `Transaction` por rota (latência, Apdex, erros), consultas MySQL, traces distribuídos            |
| **Eventos de negócio**  | porta `Telemetria` (`app/shared/use-cases/telemetria.ts`) → adaptador `TelemetriaNewRelic`      | `OrdemServicoCriada`, `OrdemServicoMudouStatus`, `IntegracaoFalhou` (custom events)              |
| **Logs em contexto**    | pino JSON + `@newrelic/pino-enricher` (`config/logger.ts`)                                      | cada linha com `trace.id`, `span.id`, `entity.guid` e o `request_id` do middleware de correlação |
| **Infra do Kubernetes** | Helm `nri-bundle` no repo [`oficina-infra-k8s`](https://github.com/Fabio-GST/oficina-infra-k8s) | `K8sPodSample`, `K8sContainerSample`, eventos do cluster e coleta dos logs (`Log`)               |

### Eventos de negócio

| Evento                    | Publicado por                                                                                                                                                              | Atributos                                                                                                            |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `OrdemServicoCriada`      | política `RegistrarCriacaoDaOS` em `ordem-servico.aberta`                                                                                                                  | `ordemServicoId`, `clienteId`, `veiculoId`                                                                           |
| `OrdemServicoMudouStatus` | política `RegistrarMudancaDeStatusDaOS` em cada evento de transição (`diagnostico-iniciado`, `orcamento-gerado`, `aprovada`, `recusada`, `finalizada`, `veiculo-entregue`) | `ordemServicoId`, `de`, `para`, `duracaoMs` (tempo que a OS ficou no status `de`, derivado de `historico_status_os`) |
| `IntegracaoFalhou`        | adaptador de e-mail (SMTP) e middleware do webhook de orçamento                                                                                                            | `integracao` (`email` \| `webhook`), `erro`, `assunto`/`rota`                                                        |

A renegociação (`AGUARDANDO_APROVACAO → EM_DIAGNOSTICO`) não emite evento de domínio e por isso
não gera `OrdemServicoMudouStatus`; a próxima transição contabiliza o tempo desde ela.

Sem `NEW_RELIC_LICENSE_KEY` (local e testes) a porta usa `TelemetriaNula` e o agente fica
desligado — o módulo `newrelic` nem é importado.

## Configuração

1. Crie uma conta gratuita no New Relic (100 GB/mês) e copie a **ingest license key**
   (_API keys_ → tipo _INGEST - LICENSE_).
2. No repositório `oficina-api`, cadastre o secret `NEW_RELIC_LICENSE_KEY` nos environments
   `hml` e `prod`. O CD o coloca no Secret `oficina-secrets`; o `NEW_RELIC_APP_NAME`
   (`oficina-api-hml` / `oficina-api-prod`) vem do ConfigMap do overlay.
3. No repositório `oficina-infra-k8s`, cadastre o mesmo secret `NEW_RELIC_LICENSE_KEY` (o CD o
   passa como `TF_VAR_new_relic_license_key` para o Helm `nri-bundle`, cluster `oficina`).
4. Importe o [`dashboard-oficina.json`](./dashboard-oficina.json) e crie as condições de
   [`alertas.md`](./alertas.md).
5. (Uptime) crie um monitor **Synthetics → Ping** em `GET {gateway}/health` a cada 5 minutos.

## Consultas NRQL dos painéis

Latência p95 por rota:

```sql
SELECT percentile(duration * 1000, 50, 95) FROM Transaction
WHERE appName LIKE 'oficina-api-%' FACET request.uri TIMESERIES AUTO
```

CPU e memória por pod da API:

```sql
SELECT average(cpuUsedCores) AS 'CPU (cores)', average(memoryWorkingSetBytes) / 1e6 AS 'Memória (MB)'
FROM K8sContainerSample WHERE clusterName = 'oficina' AND containerName = 'api'
FACET podName TIMESERIES AUTO
```

Volume diário de OS:

```sql
SELECT count(*) FROM OrdemServicoCriada WHERE appName LIKE 'oficina-api-%'
TIMESERIES 1 day SINCE 30 days ago
```

Tempo médio por status (minutos):

```sql
SELECT average(duracaoMs) / 60000 AS 'minutos' FROM OrdemServicoMudouStatus
WHERE appName LIKE 'oficina-api-%' FACET de SINCE 7 days ago
```

Falhas de integração:

```sql
SELECT count(*) FROM IntegracaoFalhou WHERE appName LIKE 'oficina-api-%'
FACET integracao TIMESERIES AUTO
```

Logs de uma requisição a partir do trace:

```sql
SELECT timestamp, level, message, request_id FROM Log WHERE trace.id = '<trace.id>'
```
