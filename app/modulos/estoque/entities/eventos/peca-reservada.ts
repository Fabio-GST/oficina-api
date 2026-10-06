import type { EventoDeDominio } from '#shared/entities/evento-de-dominio'

/** Disparado quando unidades de uma peça são reservadas (bloqueadas). */
export class PecaReservada implements EventoDeDominio {
  readonly nome = 'estoque.peca-reservada'
  readonly ocorridoEm = new Date()

  constructor(
    readonly pecaId: string,
    readonly quantidade: number
  ) {}
}
