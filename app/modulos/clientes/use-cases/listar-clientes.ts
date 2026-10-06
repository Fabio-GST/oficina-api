import type { CasoDeUso } from '#shared/use-cases/caso-de-uso'
import type { RepositorioDeClientes } from './ports/repositorio-de-clientes.js'
import { paraDTO, type ClienteDTO } from './dtos.js'

/** Lista todos os clientes cadastrados. */
export class ListarClientes implements CasoDeUso<void, ClienteDTO[]> {
  constructor(private readonly repositorio: RepositorioDeClientes) {}

  async executar(): Promise<ClienteDTO[]> {
    const clientes = await this.repositorio.listar()
    return clientes.map(paraDTO)
  }
}
