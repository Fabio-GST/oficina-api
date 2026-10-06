import { opcoesDeCliente } from '#shared/frameworks-drivers/contexto-transacional'
import type { RepositorioDeSolicitacoesCompra } from '../../use-cases/ports/repositorio-de-solicitacoes-compra.js'
import type { SolicitacaoDeCompra } from '../../entities/solicitacao-de-compra.js'
import SolicitacaoCompraModel from '../../frameworks-drivers/models/solicitacao_compra_model.js'
import { MapeadorDeSolicitacaoCompra } from './mapeador-de-solicitacao-compra.js'

export class RepositorioDeSolicitacoesCompraLucid implements RepositorioDeSolicitacoesCompra {
  async salvar(solicitacao: SolicitacaoDeCompra): Promise<void> {
    const dados = MapeadorDeSolicitacaoCompra.paraPersistencia(solicitacao)
    await SolicitacaoCompraModel.updateOrCreate({ id: dados.id }, dados, opcoesDeCliente())
  }

  async buscarPorId(id: string): Promise<SolicitacaoDeCompra | null> {
    const model = await SolicitacaoCompraModel.find(id, opcoesDeCliente())
    return model ? MapeadorDeSolicitacaoCompra.paraDominio(model) : null
  }

  async listar(): Promise<SolicitacaoDeCompra[]> {
    const models = await SolicitacaoCompraModel.query(opcoesDeCliente()).orderBy(
      'created_at',
      'desc'
    )
    return models.map(MapeadorDeSolicitacaoCompra.paraDominio)
  }
}
