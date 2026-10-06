import type { CasoDeUso } from '#shared/use-cases/caso-de-uso'
import { RecursoNaoEncontrado } from '#shared/entities/erros'
import type { RepositorioDeVeiculos } from './ports/repositorio-de-veiculos.js'
import { paraDTO, type VeiculoDTO } from './dtos.js'

/** Obtém um veículo pelo identificador. */
export class ObterVeiculo implements CasoDeUso<string, VeiculoDTO> {
  constructor(private readonly repositorio: RepositorioDeVeiculos) {}

  async executar(id: string): Promise<VeiculoDTO> {
    const veiculo = await this.repositorio.buscarPorId(id)
    if (!veiculo) {
      throw new RecursoNaoEncontrado('Veículo', id)
    }
    return paraDTO(veiculo)
  }
}
