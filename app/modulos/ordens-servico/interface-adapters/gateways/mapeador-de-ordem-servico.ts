import { Dinheiro } from '#shared/entities/objetos-de-valor/dinheiro'
import { OrdemServico } from '../../entities/ordem-servico.js'
import { ItemOrdemServico, type TipoItem } from '../../entities/item-ordem-servico.js'
import {
  StatusOrdemServico,
  StatusOS,
} from '../../entities/objetos-de-valor/status-ordem-servico.js'
import { PrioridadeOS } from '../../entities/objetos-de-valor/prioridade-os.js'
import type OrdemServicoModel from '../../frameworks-drivers/models/ordem_servico_model.js'

export const MapeadorDeOrdemServico = {
  paraDominio(model: OrdemServicoModel): OrdemServico {
    return OrdemServico.reconstituir({
      id: model.id,
      clienteId: model.clienteId,
      veiculoId: model.veiculoId,
      status: StatusOrdemServico.criar(model.status as StatusOS),
      prioridade: (model.prioridade as PrioridadeOS) ?? PrioridadeOS.NORMAL,
      itens: model.itens.map((item) =>
        ItemOrdemServico.reconstituir({
          id: item.id,
          tipo: item.tipo as TipoItem,
          referenciaId: item.referenciaId,
          descricao: item.descricao,
          precoUnitario: Dinheiro.deCentavos(item.precoUnitarioCentavos),
          quantidade: item.quantidade,
        })
      ),
      historico: model.historico.map((registro) => ({
        status: registro.status as StatusOS,
        ocorridoEm: registro.ocorridoEm,
      })),
      criadaEm: model.createdAt,
    })
  },
}
