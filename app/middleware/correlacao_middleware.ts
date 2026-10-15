import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Correlação de requisições. O `request.id()` do AdonisJS reaproveita o
 * header `x-request-id` quando presente (o API Gateway envia o seu) e gera um
 * UUID caso contrário; o framework já cria `ctx.logger` como child logger com
 * `request_id`. Este middleware devolve o id no header da resposta e registra
 * um log estruturado por requisição (rota, status, duração, portador).
 */
export default class CorrelacaoMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const inicio = process.hrtime.bigint()
    const requestId = ctx.request.id()
    if (requestId) ctx.response.header('x-request-id', requestId)

    try {
      return await next()
    } finally {
      const duracaoMs = Number(process.hrtime.bigint() - inicio) / 1_000_000
      ctx.logger.info(
        {
          metodo: ctx.request.method(),
          rota: ctx.route?.pattern ?? ctx.request.url(),
          status: ctx.response.getStatus(),
          duracaoMs: Math.round(duracaoMs * 100) / 100,
          usuarioId: ctx.usuarioAutenticado?.sub,
          papel: ctx.usuarioAutenticado?.papel,
        },
        'requisicao concluida'
      )
    }
  }
}
