import { Veiculo } from '../../entities/veiculo.js'
import { Placa } from '../../entities/objetos-de-valor/placa.js'

export interface RepositorioDeVeiculos {
  salvar(veiculo: Veiculo): Promise<void>
  buscarPorId(id: string): Promise<Veiculo | null>
  buscarPorPlaca(placa: Placa): Promise<Veiculo | null>
  existeComPlaca(placa: Placa): Promise<boolean>
  listar(): Promise<Veiculo[]>
  listarPorCliente(clienteId: string): Promise<Veiculo[]>
  remover(id: string): Promise<void>
}
