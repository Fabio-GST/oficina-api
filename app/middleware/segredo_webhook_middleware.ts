import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import env from '#start/env'
import { NaoAutenticado } from '#shared/entities/erros'
import { descreverErro, type Telemetria } from '#shared/use-cases/telemetria'
import { telemetria as telemetriaPadrao } from '#shared/frameworks-drivers/telemetria/fabrica'

/**
 * Protege endpoints de webhook (notificações de sistemas externos) exigindo o
 * segredo compartilhado no header `x-webhook-token`, independente do JWT
 * administrativo. Sem `WEBHOOK_SECRET` configurado, nega qualquer chamada
 * (fail-closed).
 *
 * Qualquer falha no processamento do webhook — token inválido ou erro no caso
 * de uso — é registrada como `IntegracaoFalhou { integracao: 'webhook' }` para
 * o painel/alerta de integrações (RFC 0004) e então propagada.
 */
export default class SegredoWebhookMiddleware {
  constructor(private readonly telemetria: Telemetria = telemetriaPadrao) {}

  async handle(ctx: HttpContext, next: NextFn) {
    try {
      const segredo = env.get('WEBHOOK_SECRET')
      const token = ctx.request.header('x-webhook-token')

      if (!segredo || !token || token !== segredo) {
        throw new NaoAutenticado('Token de webhook ausente ou inválido.')
      }

      return await next()
    } catch (erro) {
      this.telemetria.registrarEvento('IntegracaoFalhou', {
        integracao: 'webhook',
        erro: descreverErro(erro),
        rota: ctx.route?.pattern ?? ctx.request.url(),
      })
      throw erro
    }
  }
}
