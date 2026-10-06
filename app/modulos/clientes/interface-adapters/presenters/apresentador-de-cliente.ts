import type { ClienteDTO } from '../../use-cases/dtos.js'

/**
 * Presenter: único ponto que conhece o formato JSON externo do recurso.
 * Hoje é a identidade sobre o DTO; mudanças de contrato HTTP acontecem aqui,
 * sem tocar nos casos de uso.
 */
export function apresentarCliente(dto: ClienteDTO) {
  return dto
}

export function apresentarClientes(dtos: ClienteDTO[]) {
  return dtos.map(apresentarCliente)
}
