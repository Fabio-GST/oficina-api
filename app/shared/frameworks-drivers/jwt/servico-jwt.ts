import jwt from 'jsonwebtoken'
import env from '#start/env'
import { NaoAutenticado } from '#shared/entities/erros'
import type { ConteudoAutenticado, EmissorDeToken } from '#shared/use-cases/emissor-de-token'

/**
 * Serviço de emissão e verificação de JSON Web Tokens (JWT) usado pela
 * autenticação das APIs administrativas.
 */
export class ServicoJwt implements EmissorDeToken {
  private readonly segredo = env.get('JWT_SECRET')
  private readonly expiraEm = env.get('JWT_EXPIRES_IN', '1h')

  emitir(conteudo: ConteudoAutenticado): string {
    return jwt.sign(conteudo, this.segredo, {
      expiresIn: this.expiraEm as jwt.SignOptions['expiresIn'],
    })
  }

  verificar(token: string): ConteudoAutenticado {
    try {
      const payload = jwt.verify(token, this.segredo) as jwt.JwtPayload
      return { sub: payload.sub as string, nome: payload.nome, email: payload.email }
    } catch {
      throw new NaoAutenticado('Token inválido ou expirado.')
    }
  }
}

export const servicoJwt = new ServicoJwt()
