import type { Peca } from '../entities/peca.js'
import type { SolicitacaoDeCompra, StatusSolicitacao } from '../entities/solicitacao-de-compra.js'

export interface PecaDTO {
  id: string
  nome: string
  descricao: string | null
  preco: number
  quantidadeEstoque: number
  quantidadeReservada: number
  estoqueMinimo: number
}

export function paraDTO(peca: Peca): PecaDTO {
  return {
    id: peca.id,
    nome: peca.nome,
    descricao: peca.descricao,
    preco: peca.preco.reais,
    quantidadeEstoque: peca.quantidadeEstoque.valor,
    quantidadeReservada: peca.quantidadeReservada,
    estoqueMinimo: peca.estoqueMinimo,
  }
}

export interface SolicitacaoCompraDTO {
  id: string
  pecaId: string
  quantidade: number
  status: StatusSolicitacao
  criadaEm: string
  recebidaEm: string | null
}

export function solicitacaoParaDTO(solicitacao: SolicitacaoDeCompra): SolicitacaoCompraDTO {
  return {
    id: solicitacao.id,
    pecaId: solicitacao.pecaId,
    quantidade: solicitacao.quantidade,
    status: solicitacao.status,
    criadaEm: solicitacao.criadaEm.toISO() ?? '',
    recebidaEm: solicitacao.recebidaEm?.toISO() ?? null,
  }
}
