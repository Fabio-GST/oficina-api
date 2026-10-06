import type { RepositorioDeClientes } from '#modulos/clientes/use-cases/ports/repositorio-de-clientes'
import type { PortalDeClientes } from '../../../use-cases/ports/portal-de-clientes.js'

/** Adapter ACL: traduz o contexto de Clientes para a linguagem de Veículos. */
export class PortalDeClientesAdapter implements PortalDeClientes {
  constructor(private readonly clientes: RepositorioDeClientes) {}

  async clienteExiste(id: string): Promise<boolean> {
    const cliente = await this.clientes.buscarPorId(id)
    return cliente !== null
  }
}
