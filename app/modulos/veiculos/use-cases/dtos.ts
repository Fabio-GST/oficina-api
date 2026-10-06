import type { Veiculo } from '../entities/veiculo.js'

export interface VeiculoDTO {
  id: string
  clienteId: string
  placa: string
  marca: string
  modelo: string
  ano: number
}

export function paraDTO(veiculo: Veiculo): VeiculoDTO {
  return {
    id: veiculo.id,
    clienteId: veiculo.clienteId,
    placa: veiculo.placa.valor,
    marca: veiculo.marca,
    modelo: veiculo.modelo,
    ano: veiculo.ano,
  }
}
