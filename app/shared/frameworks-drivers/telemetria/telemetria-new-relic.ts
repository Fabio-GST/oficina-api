import newrelic from 'newrelic'
import type {
  AtributosDeTelemetria,
  NomeEventoDeTelemetria,
  Telemetria,
} from '#shared/use-cases/telemetria'

/**
 * Adaptador New Relic da porta de telemetria: cada evento vira um *custom
 * event* (`recordCustomEvent`), consultável em NRQL — ex.:
 * `SELECT count(*) FROM OrdemServicoCriada SINCE 1 day ago`. O módulo `newrelic`
 * é o mesmo agente carregado pelo `NODE_OPTIONS=-r newrelic`; quando o agente
 * está desabilitado a chamada é um no-op.
 */
export class TelemetriaNewRelic implements Telemetria {
  registrarEvento(nome: NomeEventoDeTelemetria, atributos: AtributosDeTelemetria): void {
    newrelic.recordCustomEvent(nome, atributos)
  }
}
