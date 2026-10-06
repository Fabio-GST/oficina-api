import type { CasoDeUso } from '#shared/use-cases/caso-de-uso'
import { RecursoNaoEncontrado } from '#shared/entities/erros'
import { coletarEventosDe } from '#shared/use-cases/coletor-de-eventos'
import type { RepositorioDePecas } from './ports/repositorio-de-pecas.js'
import { paraDTO, type PecaDTO } from './dtos.js'
import type { EntradaMovimentarPeca } from './reservar-peca.js'

/** Libera uma reserva, devolvendo as unidades ao disponível. */
export class LiberarReservaDePeca implements CasoDeUso<EntradaMovimentarPeca, PecaDTO> {
  constructor(private readonly repositorio: RepositorioDePecas) {}

  async executar(entrada: EntradaMovimentarPeca): Promise<PecaDTO> {
    const peca = await this.repositorio.buscarPorId(entrada.id)
    if (!peca) {
      throw new RecursoNaoEncontrado('Peça', entrada.id)
    }
    peca.liberarReserva(entrada.quantidade)
    await this.repositorio.salvar(peca)
    await coletarEventosDe(peca)
    return paraDTO(peca)
  }
}
