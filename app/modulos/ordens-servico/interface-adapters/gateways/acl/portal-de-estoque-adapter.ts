import type { Peca } from '#modulos/estoque/entities/peca'
import type { RepositorioDePecas } from '#modulos/estoque/use-cases/ports/repositorio-de-pecas'
import type { ReservarPeca } from '#modulos/estoque/use-cases/reservar-peca'
import type { PecaDoEstoque, PortalDeEstoque } from '../../../use-cases/ports/portal-de-estoque.js'

/**
 * Adapter ACL: traduz o contexto de Estoque para a linguagem de OS. A reserva
 * delega ao caso de uso `ReservarPeca` do próprio Estoque, que valida saldo,
 * persiste o agregado e coleta os eventos de domínio.
 */
export class PortalDeEstoqueAdapter implements PortalDeEstoque {
  constructor(
    private readonly pecas: RepositorioDePecas,
    private readonly reservarPeca: ReservarPeca
  ) {}

  async obterPeca(id: string): Promise<PecaDoEstoque | null> {
    const peca = await this.pecas.buscarPorId(id)
    return peca ? paraEstoque(peca) : null
  }

  async obterPecas(ids: string[]): Promise<PecaDoEstoque[]> {
    const pecas = await this.pecas.buscarVarias(ids)
    return pecas.map(paraEstoque)
  }

  async reservar(pecaId: string, quantidade: number): Promise<void> {
    await this.reservarPeca.executar({ id: pecaId, quantidade })
  }
}

function paraEstoque(peca: Peca): PecaDoEstoque {
  return { id: peca.id, nome: peca.nome, preco: peca.preco }
}
