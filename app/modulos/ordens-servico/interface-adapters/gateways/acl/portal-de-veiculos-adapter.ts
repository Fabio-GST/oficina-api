import type { RepositorioDeVeiculos } from '#modulos/veiculos/use-cases/ports/repositorio-de-veiculos'
import type {
  PortalDeVeiculos,
  VeiculoDaOrdem,
} from '../../../use-cases/ports/portal-de-veiculos.js'

/** Adapter ACL: traduz o contexto de Veículos para a linguagem de OS. */
export class PortalDeVeiculosAdapter implements PortalDeVeiculos {
  constructor(private readonly veiculos: RepositorioDeVeiculos) {}

  async obterVeiculo(id: string): Promise<VeiculoDaOrdem | null> {
    const veiculo = await this.veiculos.buscarPorId(id)
    return veiculo ? { id: veiculo.id, clienteId: veiculo.clienteId } : null
  }
}
