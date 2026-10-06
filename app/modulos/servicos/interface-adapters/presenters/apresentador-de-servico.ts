import type { ServicoDTO } from '../../use-cases/dtos.js'

/** Presenter: único ponto que conhece o formato JSON externo do recurso. */
export function apresentarServico(dto: ServicoDTO) {
  return dto
}

export function apresentarServicos(dtos: ServicoDTO[]) {
  return dtos.map(apresentarServico)
}
