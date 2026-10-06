import type { EventoDeDominio } from '#shared/entities/evento-de-dominio'

/**
 * Disparado ao buscar um veículo pela placa. Quando `encontrado` é falso,
 * habilita a Política "se não encontrado, dispara cadastro" (Fase 2).
 */
export class BuscaDeVeiculoRealizada implements EventoDeDominio {
  readonly nome = 'veiculos.busca-realizada'
  readonly ocorridoEm = new Date()

  constructor(
    readonly placa: string,
    readonly encontrado: boolean,
    readonly veiculoId?: string
  ) {}
}
