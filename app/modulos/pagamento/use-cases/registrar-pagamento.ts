import type { CasoDeUso } from '#shared/use-cases/caso-de-uso'
import { RecursoNaoEncontrado } from '#shared/entities/erros'
import { Dinheiro } from '#shared/entities/objetos-de-valor/dinheiro'
import { coletarEventosDe } from '#shared/use-cases/coletor-de-eventos'
import type { RepositorioDePagamentos } from './ports/repositorio-de-pagamentos.js'
import { paraDTO, type PagamentoDTO } from './dtos.js'

export interface EntradaRegistrarPagamento {
  id: string
  valor: number
}

/** Registra um valor pago em um pagamento existente. */
export class RegistrarPagamento implements CasoDeUso<EntradaRegistrarPagamento, PagamentoDTO> {
  constructor(private readonly repositorio: RepositorioDePagamentos) {}

  async executar(entrada: EntradaRegistrarPagamento): Promise<PagamentoDTO> {
    const pagamento = await this.repositorio.buscarPorId(entrada.id)
    if (!pagamento) {
      throw new RecursoNaoEncontrado('Pagamento', entrada.id)
    }
    pagamento.registrarPagamento(Dinheiro.deReais(entrada.valor))
    await this.repositorio.salvar(pagamento)
    await coletarEventosDe(pagamento)
    return paraDTO(pagamento)
  }
}
