import type { EventoDeDominio } from '#shared/entities/evento-de-dominio'

/** Disparado quando uma cobrança é gerada para uma Ordem de Serviço. */
export class CobrancaGerada implements EventoDeDominio {
  readonly nome = 'pagamento.cobranca-gerada'
  readonly ocorridoEm = new Date()

  constructor(
    readonly pagamentoId: string,
    readonly ordemId: string,
    readonly valorTotalCentavos: number
  ) {}
}
