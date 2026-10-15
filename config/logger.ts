import env from '#start/env'
import app from '@adonisjs/core/services/app'
import { defineConfig, targets } from '@adonisjs/core/logger'

/**
 * Enriquecedor do New Relic (RFC 0004): adiciona `trace.id`, `span.id` e
 * `entity.*` a cada linha JSON do pino, correlacionando log → trace → requisição
 * no painel. Só entra com o agente habilitado (produção com license key); nos
 * demais casos o módulo `newrelic` nem é importado e a configuração fica vazia.
 */
async function enriquecedorNewRelic() {
  if (!app.inProduction || !env.get('NEW_RELIC_LICENSE_KEY')) {
    return {}
  }
  const { default: nrPino } = await import('@newrelic/pino-enricher')
  return nrPino()
}

const loggerConfig = defineConfig({
  default: 'app',

  /**
   * The loggers object can be used to define multiple loggers.
   * By default, we configure only one logger (named "app").
   */
  loggers: {
    app: {
      enabled: true,
      name: env.get('APP_NAME'),
      level: env.get('LOG_LEVEL'),
      ...(await enriquecedorNewRelic()),
      transport: {
        targets: targets()
          .pushIf(!app.inProduction, targets.pretty())
          .pushIf(app.inProduction, targets.file({ destination: 1 }))
          .toArray(),
      },
    },
  },
})

export default loggerConfig

/**
 * Inferring types for the list of loggers you have configured
 * in your application.
 */
declare module '@adonisjs/core/types' {
  export interface LoggersList extends InferLoggers<typeof loggerConfig> {}
}
