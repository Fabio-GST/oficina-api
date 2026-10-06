import type { CasoDeUso } from '#shared/use-cases/caso-de-uso'
import { RecursoNaoEncontrado } from '#shared/entities/erros'
import type { RepositorioDePagamentos } from './ports/repositorio-de-pagamentos.js'
import { paraDTO, type PagamentoDTO } from './dtos.js'

/** Obtém um pagamento pelo identificador. */
export class ObterPagamento implements CasoDeUso<string, PagamentoDTO> {
  constructor(private readonly repositorio: RepositorioDePagamentos) {}

  async executar(id: string): Promise<PagamentoDTO> {
    const pagamento = await this.repositorio.buscarPorId(id)
    if (!pagamento) {
      throw new RecursoNaoEncontrado('Pagamento', id)
    }
    return paraDTO(pagamento)
  }
}
