import type { EventoDeDominio } from '#shared/entities/evento-de-dominio'

/** Disparado quando um novo veículo é cadastrado. */
export class VeiculoCadastrado implements EventoDeDominio {
  readonly nome = 'veiculos.cadastrado'
  readonly ocorridoEm = new Date()

  constructor(
    readonly veiculoId: string,
    readonly clienteId: string
  ) {}
}
