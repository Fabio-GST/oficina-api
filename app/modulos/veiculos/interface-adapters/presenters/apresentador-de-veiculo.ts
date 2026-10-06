import type { VeiculoDTO } from '../../use-cases/dtos.js'

/** Presenter: único ponto que conhece o formato JSON externo do recurso. */
export function apresentarVeiculo(dto: VeiculoDTO) {
  return dto
}

export function apresentarVeiculos(dtos: VeiculoDTO[]) {
  return dtos.map(apresentarVeiculo)
}
