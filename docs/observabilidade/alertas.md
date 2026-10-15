# Condições de alerta (RFC 0004)

Crie uma _policy_ `oficina` em **Alerts → Alert conditions → New condition (NRQL)** e cadastre
as cinco condições abaixo. Ligue a policy a um canal (e-mail do time) em _Workflows_.

| #   | Condição                       | NRQL                                                                                                                                                                                 | Limiar (critical)             | Janela |
| --- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------- | ------ |
| 1   | Erros no processamento de OS   | `SELECT percentage(count(*), WHERE error IS true) FROM Transaction WHERE appName LIKE 'oficina-api-%' AND (request.uri LIKE '/work-orders%' OR request.uri LIKE '/me/work-orders%')` | `> 5` por pelo menos 5 min    | 1 min  |
| 2   | Falha nas integrações          | `SELECT count(*) FROM IntegracaoFalhou WHERE appName LIKE 'oficina-api-%'`                                                                                                           | `>= 1` em 5 min               | 5 min  |
| 3   | Degradação de latência (Apdex) | `SELECT apdex(duration, t: 0.5) FROM Transaction WHERE appName LIKE 'oficina-api-%'`                                                                                                 | `< 0.7` por pelo menos 10 min | 1 min  |
| 4a  | Pods em CrashLoopBackOff       | `SELECT uniqueCount(podName) FROM K8sContainerSample WHERE clusterName = 'oficina' AND namespaceName LIKE 'oficina-%' AND reason = 'CrashLoopBackOff'`                               | `>= 1` por pelo menos 5 min   | 1 min  |
| 4b  | Réplicas disponíveis da API    | `SELECT latest(podsAvailable) FROM K8sDeploymentSample WHERE clusterName = 'oficina' AND namespaceName = 'oficina-prod' AND deploymentName = 'oficina-api'`                          | `< 2` por pelo menos 5 min    | 1 min  |
| 5   | Uptime do healthcheck          | monitor Synthetics **Ping** em `GET {gateway}/health` (5 min) — condição _Synthetics → Monitor failure_                                                                              | 2 falhas consecutivas         | —      |

Observações:

- Em `hml` o Deployment roda com 1 réplica; a condição 4b vale para `oficina-prod`.
- A condição 1 cobre "falhas no processamento de ordens de serviço" (requisito do enunciado);
  erros 4xx de validação não contam como `error` no APM, apenas 5xx e exceções.
- Para a condição 5 o New Relic exige o monitor criado antes (a URL do gateway sai em
  `/oficina/<amb>/gateway/url` no SSM).
