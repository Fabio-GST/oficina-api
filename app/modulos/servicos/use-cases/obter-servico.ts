import type { CasoDeUso } from '#shared/use-cases/caso-de-uso'
import { RecursoNaoEncontrado } from '#shared/entities/erros'
import type { RepositorioDeServicos } from './ports/repositorio-de-servicos.js'
import { paraDTO, type ServicoDTO } from './dtos.js'

/** Obtém um serviço pelo identificador. */
export class ObterServico implements CasoDeUso<string, ServicoDTO> {
  constructor(private readonly repositorio: RepositorioDeServicos) {}

  async executar(id: string): Promise<ServicoDTO> {
    const servico = await this.repositorio.buscarPorId(id)
    if (!servico) {
      throw new RecursoNaoEncontrado('Serviço', id)
    }
    return paraDTO(servico)
  }
}
