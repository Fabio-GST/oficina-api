import type { CasoDeUso } from '#shared/use-cases/caso-de-uso'
import type { ServicoDeHash } from '#shared/use-cases/servico-de-hash'
import { ConflitoDeRecurso } from '#shared/entities/erros'
import type { RepositorioDeUsuarios } from './ports/repositorio-de-usuarios.js'
import { Usuario } from '../entities/usuario.js'
import { Email } from '../entities/objetos-de-valor/email.js'

export interface EntradaRegistrarAdministrador {
  nome: string
  email: string
  senha: string
}

export interface SaidaRegistrarAdministrador {
  id: string
  nome: string
  email: string
}

/** Cadastra um novo usuário administrativo da oficina. */
export class RegistrarAdministrador implements CasoDeUso<
  EntradaRegistrarAdministrador,
  SaidaRegistrarAdministrador
> {
  constructor(
    private readonly repositorio: RepositorioDeUsuarios,
    private readonly hash: ServicoDeHash
  ) {}

  async executar(entrada: EntradaRegistrarAdministrador): Promise<SaidaRegistrarAdministrador> {
    const email = Email.criar(entrada.email)

    if (await this.repositorio.existeComEmail(email)) {
      throw new ConflitoDeRecurso(`Já existe um usuário com o e-mail ${email.valor}.`)
    }

    const senhaHash = await this.hash.gerar(entrada.senha)
    const usuario = Usuario.criar({ nome: entrada.nome, email, senhaHash })

    await this.repositorio.salvar(usuario)

    return { id: usuario.id, nome: usuario.nome, email: usuario.email.valor }
  }
}
