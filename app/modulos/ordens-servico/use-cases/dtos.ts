import { OrdemServico } from '../entities/ordem-servico.js'

export interface ItemDTO {
  id: string
  tipo: 'SERVICO' | 'PECA'
  referenciaId: string
  descricao: string
  precoUnitario: number
  quantidade: number
  subtotal: number
}

export interface OrdemServicoDTO {
  id: string
  clienteId: string
  veiculoId: string
  status: string
  prioridade: string
  orcamento: number
  itens: ItemDTO[]
  historico: { status: string; ocorridoEm: string }[]
  criadaEm: string
}

export interface AndamentoDTO {
  id: string
  status: string
  orcamento: number
  historico: { status: string; ocorridoEm: string }[]
}

export function paraDTO(ordem: OrdemServico): OrdemServicoDTO {
  return {
    id: ordem.id,
    clienteId: ordem.clienteId,
    veiculoId: ordem.veiculoId,
    status: ordem.status.valor,
    prioridade: ordem.prioridade,
    orcamento: ordem.orcamento().reais,
    itens: ordem.itens.map((item) => ({
      id: item.id,
      tipo: item.tipo,
      referenciaId: item.referenciaId,
      descricao: item.descricao,
      precoUnitario: item.precoUnitario.reais,
      quantidade: item.quantidade,
      subtotal: item.subtotal.reais,
    })),
    historico: ordem.historico.map((h) => ({
      status: h.status,
      ocorridoEm: h.ocorridoEm.toISO() ?? '',
    })),
    criadaEm: ordem.criadaEm.toISO() ?? '',
  }
}

export function paraAndamentoDTO(ordem: OrdemServico): AndamentoDTO {
  return {
    id: ordem.id,
    status: ordem.status.valor,
    orcamento: ordem.orcamento().reais,
    historico: ordem.historico.map((h) => ({
      status: h.status,
      ocorridoEm: h.ocorridoEm.toISO() ?? '',
    })),
  }
}
