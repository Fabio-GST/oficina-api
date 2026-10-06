import type { EventoDeDominio } from '#shared/entities/evento-de-dominio'

/** Disparado quando uma nova peça é cadastrada no estoque. */
export class PecaCadastrada implements EventoDeDominio {
  readonly nome = 'estoque.peca-cadastrada'
  readonly ocorridoEm = new Date()

  constructor(readonly pecaId: string) {}
}
