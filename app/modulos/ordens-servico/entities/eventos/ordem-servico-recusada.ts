import type { EventoDeDominio } from '#shared/entities/evento-de-dominio'

/** Disparado quando o cliente recusa o orçamento da Ordem de Serviço. */
export class OrdemServicoRecusada implements EventoDeDominio {
  readonly nome = 'ordem-servico.recusada'
  readonly ocorridoEm = new Date()

  constructor(readonly ordemServicoId: string) {}
}
