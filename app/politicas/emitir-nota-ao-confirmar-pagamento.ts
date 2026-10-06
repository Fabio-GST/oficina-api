import type { ManipuladorDeEvento } from '#shared/use-cases/manipulador-de-evento'
import type { PagamentoConfirmado } from '#modulos/pagamento/entities/eventos/pagamento-confirmado'

type EmitirNotaCmd = (pagamentoId: string) => Promise<unknown>

/**
 * Política: ao confirmar o pagamento integral, emite a Nota Fiscal de forma
 * desacoplada (assíncrona) — não acoplada ao registro do pagamento.
 */
export class EmitirNotaAoConfirmarPagamento implements ManipuladorDeEvento<PagamentoConfirmado> {
  readonly evento = 'pagamento.confirmado'

  constructor(private readonly emitirNota: EmitirNotaCmd) {}

  async manipular(evento: PagamentoConfirmado): Promise<void> {
    await this.emitirNota(evento.pagamentoId)
  }
}
