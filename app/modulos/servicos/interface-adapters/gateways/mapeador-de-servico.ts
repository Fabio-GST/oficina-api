import { Dinheiro } from '#shared/entities/objetos-de-valor/dinheiro'
import { Servico } from '../../entities/servico.js'
import type ServicoModel from '../../frameworks-drivers/models/servico_model.js'

export const MapeadorDeServico = {
  paraDominio(model: ServicoModel): Servico {
    return Servico.reconstituir({
      id: model.id,
      nome: model.nome,
      descricao: model.descricao,
      preco: Dinheiro.deCentavos(model.precoCentavos),
      ativo: Boolean(model.ativo),
      tempoEstimadoMinutos: model.tempoEstimadoMinutos,
    })
  },

  paraPersistencia(servico: Servico) {
    return {
      id: servico.id,
      nome: servico.nome,
      descricao: servico.descricao,
      precoCentavos: servico.preco.centavos,
      ativo: servico.ativo,
      tempoEstimadoMinutos: servico.tempoEstimadoMinutos,
    }
  },
}
