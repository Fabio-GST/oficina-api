import type { CasoDeUso } from '#shared/use-cases/caso-de-uso'
import { RecursoNaoEncontrado } from '#shared/entities/erros'
import { Dinheiro } from '#shared/entities/objetos-de-valor/dinheiro'
import { coletarEventosDe } from '#shared/use-cases/coletor-de-eventos'
import type { RepositorioDePagamentos } from './ports/repositorio-de-pagamentos.js'
import type { Pagamento } from '../entities/pagamento.js'
import { paraDTO, type PagamentoDTO } from './dtos.js'

export interface EntradaAplicarDesconto {
  id: string
  desconto: number
}

/** Aplica um desconto ao pagamento de uma ordem de serviço. */
export class AplicarDesconto implements CasoDeUso<EntradaAplicarDesconto, PagamentoDTO> {
  constructor(private readonly repositorio: RepositorioDePagamentos) {}

  async executar(entrada: EntradaAplicarDesconto): Promise<PagamentoDTO> {
    const pagamento = await this.buscar(entrada.id)
    pagamento.aplicarDesconto(Dinheiro.deReais(entrada.desconto))
    await this.repositorio.salvar(pagamento)
    await coletarEventosDe(pagamento)
    return paraDTO(pagamento)
  }

  private async buscar(id: string): Promise<Pagamento> {
    const pagamento = await this.repositorio.buscarPorId(id)
    if (!pagamento) {
      throw new RecursoNaoEncontrado('Pagamento', id)
    }
    return pagamento
  }
}
