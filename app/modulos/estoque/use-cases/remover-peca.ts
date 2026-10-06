import type { CasoDeUso } from '#shared/use-cases/caso-de-uso'
import { RecursoNaoEncontrado } from '#shared/entities/erros'
import type { RepositorioDePecas } from './ports/repositorio-de-pecas.js'

/** Remove uma peça do estoque pelo identificador. */
export class RemoverPeca implements CasoDeUso<string, void> {
  constructor(private readonly repositorio: RepositorioDePecas) {}

  async executar(id: string): Promise<void> {
    const peca = await this.repositorio.buscarPorId(id)
    if (!peca) {
      throw new RecursoNaoEncontrado('Peça', id)
    }
    await this.repositorio.remover(id)
  }
}
