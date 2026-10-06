import type { Pagamento, StatusPagamento } from '../entities/pagamento.js'

export interface PagamentoDTO {
  id: string
  ordemId: string
  total: number
  desconto: number
  pago: number
  valorDevido: number
  status: StatusPagamento
  notaFiscalNumero: string | null
}

export function paraDTO(pagamento: Pagamento): PagamentoDTO {
  return {
    id: pagamento.id,
    ordemId: pagamento.ordemId,
    total: pagamento.total.reais,
    desconto: pagamento.desconto.reais,
    pago: pagamento.pago.reais,
    valorDevido: pagamento.valorDevido().reais,
    status: pagamento.status,
    notaFiscalNumero: pagamento.notaFiscalNumero,
  }
}
