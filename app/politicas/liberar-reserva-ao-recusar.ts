import type { ManipuladorDeEvento } from '#shared/use-cases/manipulador-de-evento'
import type { OrdemServicoRecusada } from '#modulos/ordens-servico/entities/eventos/ordem-servico-recusada'
import type { OrdemServicoDTO } from '#modulos/ordens-servico/use-cases/dtos'

type ObterOrdem = (ordemId: string) => Promise<OrdemServicoDTO>
type LiberarReservaCmd = (entrada: { id: string; quantidade: number }) => Promise<unknown>

/**
 * Política: ao recusar a OS, libera as reservas das peças, devolvendo as
 * unidades ao estoque disponível.
 */
export class LiberarReservaAoRecusar implements ManipuladorDeEvento<OrdemServicoRecusada> {
  readonly evento = 'ordem-servico.recusada'

  constructor(
    private readonly obterOrdem: ObterOrdem,
    private readonly liberarReserva: LiberarReservaCmd
  ) {}

  async manipular(evento: OrdemServicoRecusada): Promise<void> {
    const ordem = await this.obterOrdem(evento.ordemServicoId)
    for (const item of ordem.itens) {
      if (item.tipo === 'PECA') {
        await this.liberarReserva({ id: item.referenciaId, quantidade: item.quantidade })
      }
    }
  }
}
