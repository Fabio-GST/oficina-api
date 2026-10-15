import env from '#start/env'
import { TelemetriaNula, type Telemetria } from '#shared/use-cases/telemetria'

/**
 * Seleciona a implementação da porta de telemetria: com `NEW_RELIC_LICENSE_KEY`
 * definida, usa o New Relic; sem ela (local e testes) usa o no-op — e o módulo
 * `newrelic` nem chega a ser importado.
 */
async function criarTelemetria(): Promise<Telemetria> {
  if (!env.get('NEW_RELIC_LICENSE_KEY')) {
    return new TelemetriaNula()
  }
  const { TelemetriaNewRelic } = await import('./telemetria-new-relic.js')
  return new TelemetriaNewRelic()
}

export const telemetria = await criarTelemetria()
