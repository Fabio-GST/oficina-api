import { Dinheiro } from '#shared/entities/objetos-de-valor/dinheiro'
import { Pagamento, StatusPagamento } from '../../entities/pagamento.js'
import type PagamentoModel from '../../frameworks-drivers/models/pagamento_model.js'

export const MapeadorDePagamento = {
  paraDominio(model: PagamentoModel): Pagamento {
    return Pagamento.reconstituir({
      id: model.id,
      ordemId: model.ordemId,
      total: Dinheiro.deCentavos(model.totalCentavos),
      desconto: Dinheiro.deCentavos(model.descontoCentavos),
      pago: Dinheiro.deCentavos(model.pagoCentavos),
      status: model.status as StatusPagamento,
      notaFiscalNumero: model.notaFiscalNumero,
    })
  },

  paraPersistencia(pagamento: Pagamento) {
    return {
      id: pagamento.id,
      ordemId: pagamento.ordemId,
      totalCentavos: pagamento.total.centavos,
      descontoCentavos: pagamento.desconto.centavos,
      pagoCentavos: pagamento.pago.centavos,
      status: pagamento.status,
      notaFiscalNumero: pagamento.notaFiscalNumero,
    }
  },
}
