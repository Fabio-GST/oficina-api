import type { RepositorioDeClientes } from '#modulos/clientes/use-cases/ports/repositorio-de-clientes'
import type {
  ClienteDaOrdem,
  PortalDeClientes,
} from '../../../use-cases/ports/portal-de-clientes.js'

/** Adapter ACL: traduz o contexto de Clientes para a linguagem de OS. */
export class PortalDeClientesAdapter implements PortalDeClientes {
  constructor(private readonly clientes: RepositorioDeClientes) {}

  async obterCliente(id: string): Promise<ClienteDaOrdem | null> {
    const cliente = await this.clientes.buscarPorId(id)
    return cliente ? { id: cliente.id } : null
  }
}
