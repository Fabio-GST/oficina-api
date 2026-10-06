import type { EventoDeDominio } from '#shared/entities/evento-de-dominio'

/** Disparado quando a Nota Fiscal de um pagamento é emitida. */
export class NotaFiscalEmitida implements EventoDeDominio {
  readonly nome = 'pagamento.nota-emitida'
  readonly ocorridoEm = new Date()

  constructor(
    readonly pagamentoId: string,
    readonly ordemId: string,
    readonly numero: string
  ) {}
}
