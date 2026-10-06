import type { CasoDeUso } from '#shared/use-cases/caso-de-uso'
import type { RepositorioDeServicos } from './ports/repositorio-de-servicos.js'
import { paraDTO, type ServicoDTO } from './dtos.js'

/** Lista todos os serviços cadastrados. */
export class ListarServicos implements CasoDeUso<void, ServicoDTO[]> {
  constructor(private readonly repositorio: RepositorioDeServicos) {}

  async executar(): Promise<ServicoDTO[]> {
    const servicos = await this.repositorio.listar()
    return servicos.map(paraDTO)
  }
}
