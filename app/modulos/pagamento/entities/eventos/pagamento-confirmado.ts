import type { EventoDeDominio } from '#shared/entities/evento-de-dominio'

/**
 * Disparado quando o pagamento é quitado integralmente. Habilita a Política de
 * emissão automática (assíncrona) da Nota Fiscal (Fase 2).
 */
export class PagamentoConfirmado implements EventoDeDominio {
  readonly nome = 'pagamento.confirmado'
  readonly ocorridoEm = new Date()

  constructor(
    readonly pagamentoId: string,
    readonly ordemId: string,
    readonly valorTotalCentavos: number
  ) {}
}
