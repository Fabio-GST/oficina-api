import type { EventoDeDominio } from '#shared/entities/evento-de-dominio'

/** Disparado quando uma nova Ordem de Serviço é aberta. */
export class OrdemServicoAberta implements EventoDeDominio {
  readonly nome = 'ordem-servico.aberta'
  readonly ocorridoEm = new Date()

  constructor(
    readonly ordemServicoId: string,
    readonly clienteId: string,
    readonly veiculoId: string
  ) {}
}
