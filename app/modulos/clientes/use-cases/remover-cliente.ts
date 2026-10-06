import type { CasoDeUso } from '#shared/use-cases/caso-de-uso'
import { RecursoNaoEncontrado } from '#shared/entities/erros'
import type { RepositorioDeClientes } from './ports/repositorio-de-clientes.js'

/** Remove um cliente pelo identificador. */
export class RemoverCliente implements CasoDeUso<string, void> {
  constructor(private readonly repositorio: RepositorioDeClientes) {}

  async executar(id: string): Promise<void> {
    const cliente = await this.repositorio.buscarPorId(id)
    if (!cliente) {
      throw new RecursoNaoEncontrado('Cliente', id)
    }
    await this.repositorio.remover(id)
  }
}
