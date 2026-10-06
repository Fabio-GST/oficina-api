import type { CasoDeUso } from '#shared/use-cases/caso-de-uso'
import { RecursoNaoEncontrado } from '#shared/entities/erros'
import { coletarEventosDe } from '#shared/use-cases/coletor-de-eventos'
import type { RepositorioDePecas } from './ports/repositorio-de-pecas.js'
import { paraDTO, type PecaDTO } from './dtos.js'

export interface EntradaDefinirEstoqueMinimo {
  id: string
  estoqueMinimo: number
}

/** Define o estoque mínimo de uma peça (gatilho de alerta de reposição). */
export class DefinirEstoqueMinimo implements CasoDeUso<EntradaDefinirEstoqueMinimo, PecaDTO> {
  constructor(private readonly repositorio: RepositorioDePecas) {}

  async executar(entrada: EntradaDefinirEstoqueMinimo): Promise<PecaDTO> {
    const peca = await this.repositorio.buscarPorId(entrada.id)
    if (!peca) {
      throw new RecursoNaoEncontrado('Peça', entrada.id)
    }
    peca.definirEstoqueMinimo(entrada.estoqueMinimo)
    await this.repositorio.salvar(peca)
    await coletarEventosDe(peca)
    return paraDTO(peca)
  }
}
