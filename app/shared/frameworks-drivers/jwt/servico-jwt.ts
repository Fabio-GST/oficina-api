import jwt from 'jsonwebtoken'
import env from '#start/env'
import { NaoAutenticado } from '#shared/entities/erros'
import {
  PAPEIS,
  type ConteudoAutenticado,
  type EmissorDeToken,
  type Papel,
} from '#shared/use-cases/emissor-de-token'

/** Algoritmo fixo: o mesmo usado pela Function de autenticação por CPF. */
export const ALGORITMO_JWT = 'HS256'

/**
 * Serviço de emissão e verificação de JSON Web Tokens (JWT). Verifica tanto
 * o token do administrador (emitido aqui) quanto o do cliente (emitido pela
 * Lambda com o mesmo segredo e algoritmo).
 */
export class ServicoJwt implements EmissorDeToken {
  private readonly segredo = env.get('JWT_SECRET')
  private readonly expiraEm = env.get('JWT_EXPIRES_IN', '1h')

  emitir(conteudo: ConteudoAutenticado): string {
    return jwt.sign(conteudo, this.segredo, {
      algorithm: ALGORITMO_JWT,
      expiresIn: this.expiraEm as jwt.SignOptions['expiresIn'],
    })
  }

  verificar(token: string): ConteudoAutenticado {
    let payload: jwt.JwtPayload
    try {
      payload = jwt.verify(token, this.segredo, { algorithms: [ALGORITMO_JWT] }) as jwt.JwtPayload
    } catch {
      throw new NaoAutenticado('Token inválido ou expirado.')
    }

    if (typeof payload.sub !== 'string' || !payload.sub) {
      throw new NaoAutenticado('Token sem identificação do portador.')
    }
    if (!PAPEIS.includes(payload.papel as Papel)) {
      throw new NaoAutenticado('Token sem papel reconhecido.')
    }

    return {
      sub: payload.sub,
      papel: payload.papel as Papel,
      nome: payload.nome,
      email: payload.email,
      cpf: payload.cpf,
    }
  }
}

export const servicoJwt = new ServicoJwt()
