import type { EventoDeDominio } from '#shared/entities/evento-de-dominio'

/** Disparado quando a execução da OS é finalizada. */
export class OrdemServicoFinalizada implements EventoDeDominio {
  readonly nome = 'ordem-servico.finalizada'
  readonly ocorridoEm = new Date()

  constructor(
    readonly ordemServicoId: string,
    readonly duracaoMinutos: number | null
  ) {}
}
