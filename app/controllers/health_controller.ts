import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'

/**
 * Healthcheck da API, usado pelas probes do Kubernetes e pelo HEALTHCHECK da
 * imagem Docker.
 */
export default class HealthController {
  /**
   * @liveness
   * @summary Liveness: o processo está respondendo
   * @responseBody 200 - {"status":"ok"} - Processo saudável
   */
  async liveness() {
    return { status: 'ok' }
  }

  /**
   * @readiness
   * @summary Readiness: a API consegue falar com o banco
   * @responseBody 200 - {"status":"ok","banco":"ok"} - Pronta para receber tráfego
   * @responseBody 503 - {"status":"indisponivel","banco":"falha"} - Banco inacessível
   */
  async readiness({ response, logger }: HttpContext) {
    try {
      await db.rawQuery('select 1')
      return { status: 'ok', banco: 'ok' }
    } catch (erro) {
      logger.error({ err: erro }, 'readiness: falha ao consultar o banco')
      return response.serviceUnavailable({ status: 'indisponivel', banco: 'falha' })
    }
  }
}
