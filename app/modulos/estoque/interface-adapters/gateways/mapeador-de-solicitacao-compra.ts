import { SolicitacaoDeCompra, StatusSolicitacao } from '../../entities/solicitacao-de-compra.js'
import type SolicitacaoCompraModel from '../../frameworks-drivers/models/solicitacao_compra_model.js'

export const MapeadorDeSolicitacaoCompra = {
  paraDominio(model: SolicitacaoCompraModel): SolicitacaoDeCompra {
    return SolicitacaoDeCompra.reconstituir({
      id: model.id,
      pecaId: model.pecaId,
      quantidade: model.quantidade,
      status: model.status as StatusSolicitacao,
      criadaEm: model.createdAt,
      recebidaEm: model.recebidaEm,
    })
  },

  paraPersistencia(solicitacao: SolicitacaoDeCompra) {
    return {
      id: solicitacao.id,
      pecaId: solicitacao.pecaId,
      quantidade: solicitacao.quantidade,
      status: solicitacao.status,
      recebidaEm: solicitacao.recebidaEm,
    }
  },
}
