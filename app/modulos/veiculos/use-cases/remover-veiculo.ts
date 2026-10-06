import type { CasoDeUso } from '#shared/use-cases/caso-de-uso'
import { RecursoNaoEncontrado } from '#shared/entities/erros'
import type { RepositorioDeVeiculos } from './ports/repositorio-de-veiculos.js'

/** Remove um veículo pelo identificador. */
export class RemoverVeiculo implements CasoDeUso<string, void> {
  constructor(private readonly repositorio: RepositorioDeVeiculos) {}

  async executar(id: string): Promise<void> {
    const veiculo = await this.repositorio.buscarPorId(id)
    if (!veiculo) {
      throw new RecursoNaoEncontrado('Veículo', id)
    }
    await this.repositorio.remover(id)
  }
}
