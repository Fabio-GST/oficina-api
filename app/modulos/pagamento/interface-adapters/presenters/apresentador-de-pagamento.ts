import type { PagamentoDTO } from '../../use-cases/dtos.js'

/** Presenter: único ponto que conhece o formato JSON externo do recurso. */
export function apresentarPagamento(dto: PagamentoDTO) {
  return dto
}
