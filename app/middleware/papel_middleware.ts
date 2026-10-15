import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import type { Papel } from '#shared/use-cases/emissor-de-token'
import { AcessoNegado, NaoAutenticado } from '#shared/entities/erros'

/**
 * Autorização por papel. Deve vir DEPOIS do `AutenticacaoMiddleware`: lê o
 * `papel` do JWT já verificado e nega (403) quem não estiver na lista.
 *
 *   router.group(...).use([middleware.auth(), middleware.papel({ papeis: ['admin'] })])
 */
export default class PapelMiddleware {
  async handle(ctx: HttpContext, next: NextFn, opcoes: { papeis: Papel[] }) {
    const usuario = ctx.usuarioAutenticado
    if (!usuario) {
      throw new NaoAutenticado('Token de autenticação ausente.')
    }

    if (!opcoes.papeis.includes(usuario.papel)) {
      throw new AcessoNegado(`Acesso restrito ao(s) papel(is): ${opcoes.papeis.join(', ')}.`)
    }

    return next()
  }
}
