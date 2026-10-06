import type { EventoDeDominio } from '#shared/entities/evento-de-dominio'
import type { TipoDocumento } from '../objetos-de-valor/documento.js'

/** Disparado quando um novo cliente é cadastrado. */
export class ClienteCadastrado implements EventoDeDominio {
  readonly nome = 'clientes.cadastrado'
  readonly ocorridoEm = new Date()

  constructor(
    readonly clienteId: string,
    readonly tipoDocumento: TipoDocumento
  ) {}
}
