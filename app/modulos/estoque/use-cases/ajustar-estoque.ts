import type { CasoDeUso } from '#shared/use-cases/caso-de-uso'
import { RecursoNaoEncontrado } from '#shared/entities/erros'
import { coletarEventosDe } from '#shared/use-cases/coletor-de-eventos'
import type { RepositorioDePecas } from './ports/repositorio-de-pecas.js'
import { paraDTO, type PecaDTO } from './dtos.js'

export interface EntradaAjustarEstoque {
  id: string
  quantidade: number
}

/** Define a quantidade absoluta disponível de uma peça em estoque. */
export class AjustarEstoque implements CasoDeUso<EntradaAjustarEstoque, PecaDTO> {
  constructor(private readonly repositorio: RepositorioDePecas) {}

  async executar(entrada: EntradaAjustarEstoque): Promise<PecaDTO> {
    const peca = await this.repositorio.buscarPorId(entrada.id)
    if (!peca) {
      throw new RecursoNaoEncontrado('Peça', entrada.id)
    }
    peca.definirEstoque(entrada.quantidade)
    await this.repositorio.salvar(peca)
    await coletarEventosDe(peca)
    return paraDTO(peca)
  }
}
