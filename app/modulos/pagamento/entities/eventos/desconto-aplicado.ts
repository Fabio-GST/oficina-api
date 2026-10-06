import type { EventoDeDominio } from '#shared/entities/evento-de-dominio'

/** Disparado quando um desconto é aplicado a uma cobrança. */
export class DescontoAplicado implements EventoDeDominio {
  readonly nome = 'pagamento.desconto-aplicado'
  readonly ocorridoEm = new Date()

  constructor(
    readonly pagamentoId: string,
    readonly descontoCentavos: number
  ) {}
}
