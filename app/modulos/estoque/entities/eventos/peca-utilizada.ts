import type { EventoDeDominio } from '#shared/entities/evento-de-dominio'

/** Disparado quando unidades reservadas de uma peça são consumidas. */
export class PecaUtilizada implements EventoDeDominio {
  readonly nome = 'estoque.peca-utilizada'
  readonly ocorridoEm = new Date()

  constructor(
    readonly pecaId: string,
    readonly quantidade: number
  ) {}
}
