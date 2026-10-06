import type { CasoDeUso } from '#shared/use-cases/caso-de-uso'
import { RecursoNaoEncontrado } from '#shared/entities/erros'
import type { RepositorioDeClientes } from './ports/repositorio-de-clientes.js'
import { paraDTO, type ClienteDTO } from './dtos.js'

/** Obtém um cliente pelo identificador. */
export class ObterCliente implements CasoDeUso<string, ClienteDTO> {
  constructor(private readonly repositorio: RepositorioDeClientes) {}

  async executar(id: string): Promise<ClienteDTO> {
    const cliente = await this.repositorio.buscarPorId(id)
    if (!cliente) {
      throw new RecursoNaoEncontrado('Cliente', id)
    }
    return paraDTO(cliente)
  }
}
