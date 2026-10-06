import { randomUUID } from 'node:crypto'
import type { CasoDeUso } from '#shared/use-cases/caso-de-uso'
import { RecursoNaoEncontrado } from '#shared/entities/erros'
import { coletarEventosDe } from '#shared/use-cases/coletor-de-eventos'
import type { RepositorioDePagamentos } from './ports/repositorio-de-pagamentos.js'
import { paraDTO, type PagamentoDTO } from './dtos.js'

/**
 * Emite a Nota Fiscal de um pagamento quitado. Não é chamado dentro de
 * `registrarPagamento`: é acionado pela Política de `pagamento.confirmado`
 * (Fase 2) ou manualmente, garantindo a emissão desacoplada.
 */
export class EmitirNotaFiscal implements CasoDeUso<string, PagamentoDTO> {
  constructor(private readonly repositorio: RepositorioDePagamentos) {}

  async executar(id: string): Promise<PagamentoDTO> {
    const pagamento = await this.repositorio.buscarPorId(id)
    if (!pagamento) {
      throw new RecursoNaoEncontrado('Pagamento', id)
    }
    pagamento.emitirNotaFiscal(`NF-${randomUUID().slice(0, 8).toUpperCase()}`)
    await this.repositorio.salvar(pagamento)
    await coletarEventosDe(pagamento)
    return paraDTO(pagamento)
  }
}
