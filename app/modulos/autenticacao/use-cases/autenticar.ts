import type { CasoDeUso } from '#shared/use-cases/caso-de-uso'
import type { ServicoDeHash } from '#shared/use-cases/servico-de-hash'
import type { EmissorDeToken } from '#shared/use-cases/emissor-de-token'
import { NaoAutenticado } from '#shared/entities/erros'
import type { RepositorioDeUsuarios } from './ports/repositorio-de-usuarios.js'
import { Email } from '../entities/objetos-de-valor/email.js'

export interface EntradaAutenticar {
  email: string
  senha: string
}

export interface SaidaAutenticar {
  token: string
  usuario: { id: string; nome: string; email: string }
}

/** Autentica um administrador por e-mail/senha e emite um JWT. */
export class Autenticar implements CasoDeUso<EntradaAutenticar, SaidaAutenticar> {
  constructor(
    private readonly repositorio: RepositorioDeUsuarios,
    private readonly hash: ServicoDeHash,
    private readonly emissor: EmissorDeToken
  ) {}

  async executar(entrada: EntradaAutenticar): Promise<SaidaAutenticar> {
    const email = Email.criar(entrada.email)
    const usuario = await this.repositorio.buscarPorEmail(email)

    if (!usuario || !(await this.hash.verificar(entrada.senha, usuario.senhaHash))) {
      throw new NaoAutenticado('Credenciais inválidas.')
    }

    const token = this.emissor.emitir({
      sub: usuario.id,
      nome: usuario.nome,
      email: usuario.email.valor,
    })

    return {
      token,
      usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email.valor },
    }
  }
}
