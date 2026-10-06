import type { CasoDeUso } from '#shared/use-cases/caso-de-uso'
import { RecursoNaoEncontrado } from '#shared/entities/erros'
import type { RepositorioDePecas } from './ports/repositorio-de-pecas.js'
import { paraDTO, type PecaDTO } from './dtos.js'

/** Obtém uma peça pelo identificador. */
export class ObterPeca implements CasoDeUso<string, PecaDTO> {
  constructor(private readonly repositorio: RepositorioDePecas) {}

  async executar(id: string): Promise<PecaDTO> {
    const peca = await this.repositorio.buscarPorId(id)
    if (!peca) {
      throw new RecursoNaoEncontrado('Peça', id)
    }
    return paraDTO(peca)
  }
}
