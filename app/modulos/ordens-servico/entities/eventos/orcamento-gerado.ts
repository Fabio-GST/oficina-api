import type { EventoDeDominio } from '#shared/entities/evento-de-dominio'

/** Disparado quando o orçamento da OS é gerado e enviado para aprovação. */
export class OrcamentoGerado implements EventoDeDominio {
  readonly nome = 'ordem-servico.orcamento-gerado'
  readonly ocorridoEm = new Date()

  constructor(
    readonly ordemServicoId: string,
    readonly valorCentavos: number
  ) {}
}
