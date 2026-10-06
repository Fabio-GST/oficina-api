import { randomUUID } from 'node:crypto'
import db from '@adonisjs/lucid/services/db'
import {
  contextoTransacional,
  transacaoAtual,
  opcoesDeCliente,
} from '#shared/frameworks-drivers/contexto-transacional'
import type { RepositorioDeOrdensServico } from '../../use-cases/ports/repositorio-de-ordens-servico.js'
import type { OrdemServico } from '../../entities/ordem-servico.js'
import OrdemServicoModel from '../../frameworks-drivers/models/ordem_servico_model.js'
import ItemOrdemServicoModel from '../../frameworks-drivers/models/item_ordem_servico_model.js'
import HistoricoStatusModel from '../../frameworks-drivers/models/historico_status_model.js'
import { MapeadorDeOrdemServico } from './mapeador-de-ordem-servico.js'

export class RepositorioDeOrdensServicoLucid implements RepositorioDeOrdensServico {
  /**
   * Persiste o agregado por completo (OS + itens + histórico). Garante
   * atomicidade: reutiliza a transação ativa quando existir, ou abre uma própria.
   */
  async salvar(ordem: OrdemServico): Promise<void> {
    if (transacaoAtual()) {
      await this.persistir(ordem)
    } else {
      await db.transaction((trx) => contextoTransacional.run(trx, () => this.persistir(ordem)))
    }
  }

  private async persistir(ordem: OrdemServico): Promise<void> {
    const opc = opcoesDeCliente()

    await OrdemServicoModel.updateOrCreate(
      { id: ordem.id },
      {
        id: ordem.id,
        clienteId: ordem.clienteId,
        veiculoId: ordem.veiculoId,
        status: ordem.status.valor,
        prioridade: ordem.prioridade,
        createdAt: ordem.criadaEm,
      },
      opc
    )

    // Itens e histórico são parte do agregado: regravados a cada persistência.
    await ItemOrdemServicoModel.query(opc).where('ordem_id', ordem.id).delete()
    await ItemOrdemServicoModel.createMany(
      ordem.itens.map((item) => ({
        id: item.id,
        ordemId: ordem.id,
        tipo: item.tipo,
        referenciaId: item.referenciaId,
        descricao: item.descricao,
        precoUnitarioCentavos: item.precoUnitario.centavos,
        quantidade: item.quantidade,
      })),
      opc
    )

    await HistoricoStatusModel.query(opc).where('ordem_id', ordem.id).delete()
    await HistoricoStatusModel.createMany(
      ordem.historico.map((registro) => ({
        id: randomUUID(),
        ordemId: ordem.id,
        status: registro.status,
        ocorridoEm: registro.ocorridoEm,
      })),
      opc
    )
  }

  async buscarPorId(id: string): Promise<OrdemServico | null> {
    const model = await OrdemServicoModel.query(opcoesDeCliente())
      .where('id', id)
      .preload('itens')
      .preload('historico', (q) => q.orderBy('ocorrido_em', 'asc'))
      .first()
    return model ? MapeadorDeOrdemServico.paraDominio(model) : null
  }

  async listar(): Promise<OrdemServico[]> {
    const models = await OrdemServicoModel.query(opcoesDeCliente())
      .preload('itens')
      .preload('historico', (q) => q.orderBy('ocorrido_em', 'asc'))
      .orderBy('created_at', 'desc')
    return models.map(MapeadorDeOrdemServico.paraDominio)
  }
}
