import type { EventoDeDominio } from '#shared/entities/evento-de-dominio'

/** Disparado quando o cliente aprova o orçamento da Ordem de Serviço. */
export class OrdemServicoAprovada implements EventoDeDominio {
  readonly nome = 'ordem-servico.aprovada'
  readonly ocorridoEm = new Date()

  constructor(readonly ordemServicoId: string) {}
}
