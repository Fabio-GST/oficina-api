import { Dinheiro } from '#shared/entities/objetos-de-valor/dinheiro'
import { ItemOrdemServico } from '../item-ordem-servico.js'

/**
 * Domain Service que calcula o orçamento de uma Ordem de Serviço somando os
 * subtotais de todos os itens (serviços + peças).
 */
export const CalculadoraOrcamento = {
  calcular(itens: ItemOrdemServico[]): Dinheiro {
    return itens.reduce((total, item) => total.somar(item.subtotal), Dinheiro.zero())
  },
}
