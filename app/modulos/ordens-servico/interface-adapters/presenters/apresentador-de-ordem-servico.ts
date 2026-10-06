import type { AndamentoDTO, OrdemServicoDTO } from '../../use-cases/dtos.js'
import type { TempoMedioDTO } from '../../use-cases/consultas.js'

/** Presenters: único ponto que conhece o formato JSON externo dos recursos. */
export function apresentarOrdem(dto: OrdemServicoDTO) {
  return dto
}

export function apresentarOrdens(dtos: OrdemServicoDTO[]) {
  return dtos.map(apresentarOrdem)
}

export function apresentarAndamento(dto: AndamentoDTO) {
  return dto
}

export function apresentarTempoMedio(dto: TempoMedioDTO) {
  return dto
}
