import type { ManipuladorDeEvento } from '#shared/use-cases/manipulador-de-evento'
import type { OrdemServicoAprovada } from '#modulos/ordens-servico/entities/eventos/ordem-servico-aprovada'
import type { OrdemServicoDTO } from '#modulos/ordens-servico/use-cases/dtos'

type ObterOrdem = (ordemId: string) => Promise<OrdemServicoDTO>
type UtilizarPecaCmd = (entrada: { id: string; quantidade: number }) => Promise<unknown>

/**
 * Política: ao aprovar a OS, consome (utiliza) as peças que haviam sido
 * reservadas na composição do orçamento. Substitui a baixa síncrona que antes
 * acontecia ao adicionar a peça à OS.
 */
export class UtilizarPecasAoAprovar implements ManipuladorDeEvento<OrdemServicoAprovada> {
  readonly evento = 'ordem-servico.aprovada'

  constructor(
    private readonly obterOrdem: ObterOrdem,
    private readonly utilizarPeca: UtilizarPecaCmd
  ) {}

  async manipular(evento: OrdemServicoAprovada): Promise<void> {
    const ordem = await this.obterOrdem(evento.ordemServicoId)
    for (const item of ordem.itens) {
      if (item.tipo === 'PECA') {
        await this.utilizarPeca({ id: item.referenciaId, quantidade: item.quantidade })
      }
    }
  }
}
