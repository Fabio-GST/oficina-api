import type { Servico } from '../entities/servico.js'

export interface ServicoDTO {
  id: string
  nome: string
  descricao: string | null
  preco: number
  ativo: boolean
  tempoEstimadoMinutos: number | null
}

export function paraDTO(servico: Servico): ServicoDTO {
  return {
    id: servico.id,
    nome: servico.nome,
    descricao: servico.descricao,
    preco: servico.preco.reais,
    ativo: servico.ativo,
    tempoEstimadoMinutos: servico.tempoEstimadoMinutos,
  }
}
