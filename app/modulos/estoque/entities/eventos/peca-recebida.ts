import type { EventoDeDominio } from '#shared/entities/evento-de-dominio'

/** Disparado quando unidades de uma peça são recebidas e repostas no estoque. */
export class PecaRecebida implements EventoDeDominio {
  readonly nome = 'estoque.peca-recebida'
  readonly ocorridoEm = new Date()

  constructor(
    readonly pecaId: string,
    readonly quantidade: number
  ) {}
}
