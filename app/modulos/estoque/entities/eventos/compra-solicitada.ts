import type { EventoDeDominio } from '#shared/entities/evento-de-dominio'

/** Disparado quando uma compra de peça é solicitada ao fornecedor. */
export class CompraSolicitada implements EventoDeDominio {
  readonly nome = 'estoque.compra-solicitada'
  readonly ocorridoEm = new Date()

  constructor(
    readonly solicitacaoId: string,
    readonly pecaId: string,
    readonly quantidade: number
  ) {}
}
