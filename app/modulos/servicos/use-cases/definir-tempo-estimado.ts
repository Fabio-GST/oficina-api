import type { CasoDeUso } from '#shared/use-cases/caso-de-uso'
import { RecursoNaoEncontrado } from '#shared/entities/erros'
import { coletarEventosDe } from '#shared/use-cases/coletor-de-eventos'
import type { RepositorioDeServicos } from './ports/repositorio-de-servicos.js'
import { paraDTO, type ServicoDTO } from './dtos.js'

export interface EntradaDefinirTempoEstimado {
  id: string
  tempoEstimadoMinutos: number
}

/** Define o tempo estimado de execução de um serviço, em minutos. */
export class DefinirTempoEstimado implements CasoDeUso<EntradaDefinirTempoEstimado, ServicoDTO> {
  constructor(private readonly repositorio: RepositorioDeServicos) {}

  async executar(entrada: EntradaDefinirTempoEstimado): Promise<ServicoDTO> {
    const servico = await this.repositorio.buscarPorId(entrada.id)
    if (!servico) {
      throw new RecursoNaoEncontrado('Serviço', entrada.id)
    }
    servico.definirTempoEstimado(entrada.tempoEstimadoMinutos)
    await this.repositorio.salvar(servico)
    await coletarEventosDe(servico)
    return paraDTO(servico)
  }
}
