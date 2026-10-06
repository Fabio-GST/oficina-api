import type { EventoDeDominio } from '#shared/entities/evento-de-dominio'

/** Disparado quando o diagnóstico da Ordem de Serviço é iniciado. */
export class DiagnosticoIniciado implements EventoDeDominio {
  readonly nome = 'ordem-servico.diagnostico-iniciado'
  readonly ocorridoEm = new Date()

  constructor(readonly ordemServicoId: string) {}
}
