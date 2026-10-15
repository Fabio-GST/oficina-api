import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { servicoJwt } from '#shared/frameworks-drivers/jwt/servico-jwt'
import type { ConteudoAutenticado } from '#shared/use-cases/emissor-de-token'
import { NaoAutenticado } from '#shared/entities/erros'

/**
 * Exige um JWT válido no header `Authorization: Bearer <token>` — do
 * administrador (emitido por esta API) ou do cliente (emitido pela Function
 * de autenticação por CPF). O conteúdo do token fica em `ctx.usuarioAutenticado`;
 * a autorização por papel é feita pelo `PapelMiddleware`.
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
