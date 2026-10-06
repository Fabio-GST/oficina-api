import type { PecaDTO, SolicitacaoCompraDTO } from '../../use-cases/dtos.js'

/** Presenters: único ponto que conhece o formato JSON externo dos recursos. */
export function apresentarPeca(dto: PecaDTO) {
  return dto
}

export function apresentarPecas(dtos: PecaDTO[]) {
  return dtos.map(apresentarPeca)
}

export function apresentarSolicitacaoDeCompra(dto: SolicitacaoCompraDTO) {
  return dto
}
