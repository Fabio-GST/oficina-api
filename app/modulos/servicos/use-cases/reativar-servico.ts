import type { CasoDeUso } from '#shared/use-cases/caso-de-uso'
import { RecursoNaoEncontrado } from '#shared/entities/erros'
import { coletarEventosDe } from '#shared/use-cases/coletor-de-eventos'
import type { RepositorioDeServicos } from './ports/repositorio-de-servicos.js'
import { paraDTO, type ServicoDTO } from './dtos.js'

/** Reativa um serviço previamente inativado. */
export class ReativarServico implements CasoDeUso<string, ServicoDTO> {
  constructor(private readonly repositorio: RepositorioDeServicos) {}

  async executar(id: string): Promise<ServicoDTO> {
    const servico = await this.repositorio.buscarPorId(id)
    if (!servico) {
      throw new RecursoNaoEncontrado('Serviço', id)
    }
    servico.reativar()
    await this.repositorio.salvar(servico)
    await coletarEventosDe(servico)
    return paraDTO(servico)
  }
}
