import type { ManipuladorDeEvento } from '#shared/use-cases/manipulador-de-evento'
import type { ServicoDeNotificacao } from '#shared/use-cases/servico-de-notificacao'
import type { EstoqueAbaixoDoMinimo } from '#modulos/estoque/entities/eventos/estoque-abaixo-do-minimo'

type SolicitarCompraCmd = (entrada: { pecaId: string; quantidade: number }) => Promise<unknown>

/**
 * Política: quando o disponível de uma peça cai abaixo do mínimo, alerta o
 * almoxarife e abre uma solicitação de compra para repor o estoque.
 */
export class SolicitarCompraAoAtingirMinimo implements ManipuladorDeEvento<EstoqueAbaixoDoMinimo> {
  readonly evento = 'estoque.abaixo-do-minimo'

  constructor(
    private readonly solicitarCompra: SolicitarCompraCmd,
    private readonly notificacao: ServicoDeNotificacao
  ) {}

  async manipular(evento: EstoqueAbaixoDoMinimo): Promise<void> {
    await this.notificacao.notificarAlmoxarife('Estoque abaixo do mínimo.', {
      pecaId: evento.pecaId,
      disponivel: evento.disponivel,
      minimo: evento.minimo,
    })
    // Repõe até o dobro do mínimo (ou ao menos 1 unidade).
    const quantidade = Math.max(evento.minimo * 2 - evento.disponivel, 1)
    await this.solicitarCompra({ pecaId: evento.pecaId, quantidade })
  }
}
