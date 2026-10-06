import type { EventoDeDominio } from '#shared/entities/evento-de-dominio'

/** Disparado quando um veículo é vinculado a um cliente. */
export class VeiculoVinculadoAoCliente implements EventoDeDominio {
  readonly nome = 'veiculos.vinculado-ao-cliente'
  readonly ocorridoEm = new Date()

  constructor(
    readonly veiculoId: string,
    readonly clienteId: string
  ) {}
}
