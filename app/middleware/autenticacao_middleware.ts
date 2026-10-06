import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { servicoJwt } from '#shared/frameworks-drivers/jwt/servico-jwt'
import type { ConteudoAutenticado } from '#shared/use-cases/emissor-de-token'
import { NaoAutenticado } from '#shared/entities/erros'

/**
 * Protege rotas administrativas exigindo um JWT válido no header
 * `Authorization: Bearer <token>`. O conteúdo do token é disponibilizado em
 * `ctx.usuarioAutenticado`.
 */
export default class AutenticacaoMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const cabecalho = ctx.request.header('authorization')

    if (!cabecalho || !cabecalho.toLowerCase().startsWith('bearer ')) {
      throw new NaoAutenticado('Token de autenticação ausente.')
    }

    const token = cabecalho.slice(7).trim()
    ctx.usuarioAutenticado = servicoJwt.verificar(token)

    return next()
  }
}

declare module '@adonisjs/core/http' {
  interface HttpContext {
    usuarioAutenticado?: ConteudoAutenticado
  }
}
