import type { Dinheiro } from '#shared/entities/objetos-de-valor/dinheiro'

/**
 * Porta ACL para o contexto de Estoque, na linguagem de Ordens de Serviço.
 * A reserva delega ao caso de uso do Estoque — este módulo nunca manipula o
 * agregado `Peca` diretamente.
 */
export interface PecaDoEstoque {
  id: string
  nome: string
  preco: Dinheiro
}

export interface PortalDeEstoque {
  obterPeca(id: string): Promise<PecaDoEstoque | null>
  obterPecas(ids: string[]): Promise<PecaDoEstoque[]>
  /** Reserva (bloqueia) unidades da peça para uma OS. */
  reservar(pecaId: string, quantidade: number): Promise<void>
}
