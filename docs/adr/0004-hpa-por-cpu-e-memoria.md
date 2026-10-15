# ADR 0004 — Escalabilidade com HPA por CPU e memória e Cluster Autoscaler

- **Status:** Aceito
- **Data:** 2026-10-06 (revisa a decisão da Fase 2)

## Contexto

O enunciado exige um cluster Kubernetes **com escalabilidade**. Na Fase 2 o HPA escalava por CPU
no cluster kind. No EKS há duas dimensões: réplicas da aplicação (pods) e capacidade do cluster
(nós), e o Learner Lab limita o crédito e proíbe IAM próprio (sem Karpenter, que exige roles).

## Decisão

**Duas camadas de escalonamento:**

1. **HorizontalPodAutoscaler** (`autoscaling/v2`) do `Deployment oficina-api`, por ambiente:
   - `minReplicas: 2` (prod) / `1` (hml), `maxReplicas: 5`;
   - alvo de **70 % de CPU** e **80 % de memória** sobre os `requests` do contêiner;
   - `scaleDown.stabilizationWindowSeconds: 60` para evitar oscilação na demonstração.
   Requer o **metrics-server**, instalado pelo repo `oficina-infra-k8s`.
2. **Cluster Autoscaler** (Helm, repo `oficina-infra-k8s`) sobre o node group gerenciado
   (`t3.small`, min 2 / max 4), usando as permissões da `LabRole` dos nós (sem IRSA). Entra em
   ação quando pods ficam `Pending` por falta de capacidade.

`requests`/`limits` definidos no `Deployment` (CPU 250m/500m, memória 256Mi/512Mi) para que a
utilização percentual do HPA seja significativa e o bin-packing do autoscaler funcione.

## Por que CPU **e** memória

A API é Node.js: picos de tráfego aparecem primeiro como CPU (event loop), mas vazamentos ou
cargas grandes de JSON aparecem como memória; só CPU deixaria pods estourarem `limits` sem
escalar. Métricas customizadas (requisições por segundo via Prometheus adapter) foram
consideradas e adiadas: exigem mais um componente e o APM do New Relic já mostra o throughput.

## Consequências

**Positivas**

- Demonstrável no vídeo com `kubectl get hpa -w` sob carga (`hey`/`k6`) e visível no New Relic.
- Teto de custo previsível: no máximo 4 nós `t3.small` e 5 réplicas por ambiente.

**Negativas**

- O HPA reage em ~15–30 s e o autoscaler em 1–3 min: picos muito curtos não são absorvidos.
- Sem Karpenter (IAM) a escolha de instâncias é fixa.
- `minReplicas: 2` em prod consome recursos mesmo ocioso; aceito pela disponibilidade.

## Alternativas consideradas

- **Só CPU** (Fase 2): insuficiente para cargas de memória.
- **KEDA / métricas customizadas**: mais um operador; sem necessidade no volume atual.
- **Fargate**: por pod, sem gerir nós, mas custo por vCPU/hora maior que `t3.small` para
  réplicas sempre ativas e sem suporte a DaemonSets do agente de observabilidade.
- **Karpenter**: exige IAM roles e SQS; bloqueado no Learner Lab.
