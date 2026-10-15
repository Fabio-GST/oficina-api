import { OrdemServico } from '../../entities/ordem-servico.js'

export interface RepositorioDeOrdensServico {
  salvar(ordem: OrdemServico): Promise<void>
  buscarPorId(id: string): Promise<OrdemServico | null>
  listar(): Promise<OrdemServico[]>
  /** Ordens de um cliente (portal do cliente autenticado por CPF), mais recentes primeiro. */
  listarPorCliente(clienteId: string): Promise<OrdemServico[]>
}
