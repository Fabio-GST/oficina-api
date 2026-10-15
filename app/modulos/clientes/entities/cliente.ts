import { RaizAgregado } from '#shared/entities/raiz-agregado'
import { Documento } from './objetos-de-valor/documento.js'
import { ClienteCadastrado } from './eventos/cliente-cadastrado.js'

interface PropsCliente {
  id?: string
  nome: string
  documento: Documento
  telefone?: string | null
  email?: string | null
  ativo?: boolean
}

/** Cliente da oficina. Aggregate root do contexto de Clientes. */
export class Cliente extends RaizAgregado {
  private _nome: string
  private _documento: Documento
  private _telefone: string | null
  private _email: string | null
  private _ativo: boolean

  private constructor(props: PropsCliente) {
    super(props.id)
    this._nome = props.nome
    this._documento = props.documento
    this._telefone = props.telefone ?? null
    this._email = props.email ?? null
    this._ativo = props.ativo ?? true
  }

  static criar(props: Omit<PropsCliente, 'id'>): Cliente {
    const cliente = new Cliente(props)
    cliente.registrarEvento(new ClienteCadastrado(cliente.id, cliente.documento.tipo))
    return cliente
  }

  static reconstituir(props: PropsCliente & { id: string }): Cliente {
    return new Cliente(props)
  }

  atualizar(dados: {
    nome?: string
    telefone?: string | null
    email?: string | null
    ativo?: boolean
  }): void {
    if (dados.nome !== undefined) this._nome = dados.nome
    if (dados.telefone !== undefined) this._telefone = dados.telefone
    if (dados.email !== undefined) this._email = dados.email
    if (dados.ativo !== undefined) this._ativo = dados.ativo
  }

  /** Bloqueia o cliente: a autenticação por CPF passa a recusá-lo. */
  inativar(): void {
    this._ativo = false
  }

  reativar(): void {
    this._ativo = true
  }

  get nome(): string {
    return this._nome
  }

  get documento(): Documento {
    return this._documento
  }

  get telefone(): string | null {
    return this._telefone
  }

  get email(): string | null {
    return this._email
  }

  get ativo(): boolean {
    return this._ativo
  }
}
