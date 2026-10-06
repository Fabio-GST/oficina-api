import { RaizAgregado } from '#shared/entities/raiz-agregado'
import { Email } from './objetos-de-valor/email.js'

interface PropsUsuario {
  id?: string
  nome: string
  email: Email
  senhaHash: string
}

/**
 * Usuário administrativo da oficina. Aggregate root do contexto de Autenticação.
 * Armazena apenas o hash da senha — o texto puro nunca trafega no domínio.
 */
export class Usuario extends RaizAgregado {
  private _nome: string
  private _email: Email
  private _senhaHash: string

  private constructor(props: PropsUsuario) {
    super(props.id)
    this._nome = props.nome
    this._email = props.email
    this._senhaHash = props.senhaHash
  }

  /** Cria um novo usuário (id gerado pelo domínio). */
  static criar(props: Omit<PropsUsuario, 'id'>): Usuario {
    return new Usuario(props)
  }

  /** Reconstrói um usuário a partir de dados persistidos. */
  static reconstituir(props: Required<PropsUsuario>): Usuario {
    return new Usuario(props)
  }

  get nome(): string {
    return this._nome
  }

  get email(): Email {
    return this._email
  }

  get senhaHash(): string {
    return this._senhaHash
  }
}
