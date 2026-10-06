import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import env from '#start/env'
import { NaoAutenticado } from '#shared/entities/erros'

/**
 * Protege endpoints de webhook (notificações de sistemas externos) exigindo o
 * segredo compartilhado no header `x-webhook-token`, independente do JWT
 * administrativo. Sem `WEBHOOK_SECRET` configurado, nega qualquer chamada
 * (fail-closed).
 */
export default class SegredoWebhookMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const segredo = env.get('WEBHOOK_SECRET')
    const token = ctx.request.header('x-webhook-token')

    if (!segredo || !token || token !== segredo) {
      throw new NaoAutenticado('Token de webhook ausente ou inválido.')
    }

    return next()
  }
}
