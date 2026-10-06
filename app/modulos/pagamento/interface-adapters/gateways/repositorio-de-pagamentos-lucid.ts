import { opcoesDeCliente } from '#shared/frameworks-drivers/contexto-transacional'
import type { RepositorioDePagamentos } from '../../use-cases/ports/repositorio-de-pagamentos.js'
import type { Pagamento } from '../../entities/pagamento.js'
import PagamentoModel from '../../frameworks-drivers/models/pagamento_model.js'
import { MapeadorDePagamento } from './mapeador-de-pagamento.js'

export class RepositorioDePagamentosLucid implements RepositorioDePagamentos {
  async salvar(pagamento: Pagamento): Promise<void> {
    const dados = MapeadorDePagamento.paraPersistencia(pagamento)
    await PagamentoModel.updateOrCreate({ id: dados.id }, dados, opcoesDeCliente())
  }

  async buscarPorId(id: string): Promise<Pagamento | null> {
    const model = await PagamentoModel.find(id, opcoesDeCliente())
    return model ? MapeadorDePagamento.paraDominio(model) : null
  }

  async buscarPorOrdem(ordemId: string): Promise<Pagamento | null> {
    const model = await PagamentoModel.findBy('ordem_id', ordemId, opcoesDeCliente())
    return model ? MapeadorDePagamento.paraDominio(model) : null
  }

  async listar(): Promise<Pagamento[]> {
    const models = await PagamentoModel.query(opcoesDeCliente()).orderBy('created_at', 'desc')
    return models.map(MapeadorDePagamento.paraDominio)
  }
}
