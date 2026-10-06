import { Dinheiro } from '#shared/entities/objetos-de-valor/dinheiro'
import { Peca } from '../../entities/peca.js'
import { QuantidadeEstoque } from '../../entities/objetos-de-valor/quantidade-estoque.js'
import type PecaModel from '../../frameworks-drivers/models/peca_model.js'

export const MapeadorDePeca = {
  paraDominio(model: PecaModel): Peca {
    return Peca.reconstituir({
      id: model.id,
      nome: model.nome,
      descricao: model.descricao,
      preco: Dinheiro.deCentavos(model.precoCentavos),
      quantidadeEstoque: QuantidadeEstoque.criar(model.quantidadeEstoque),
      quantidadeReservada: model.quantidadeReservada,
      estoqueMinimo: model.estoqueMinimo,
    })
  },

  paraPersistencia(peca: Peca) {
    return {
      id: peca.id,
      nome: peca.nome,
      descricao: peca.descricao,
      precoCentavos: peca.preco.centavos,
      quantidadeEstoque: peca.quantidadeEstoque.valor,
      quantidadeReservada: peca.quantidadeReservada,
      estoqueMinimo: peca.estoqueMinimo,
    }
  },
}
