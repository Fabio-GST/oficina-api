import { opcoesDeCliente } from '#shared/frameworks-drivers/contexto-transacional'
import type { RepositorioDeServicos } from '../../use-cases/ports/repositorio-de-servicos.js'
import type { Servico } from '../../entities/servico.js'
import ServicoModel from '../../frameworks-drivers/models/servico_model.js'
import { MapeadorDeServico } from './mapeador-de-servico.js'

export class RepositorioDeServicosLucid implements RepositorioDeServicos {
  async salvar(servico: Servico): Promise<void> {
    const dados = MapeadorDeServico.paraPersistencia(servico)
    await ServicoModel.updateOrCreate({ id: dados.id }, dados, opcoesDeCliente())
  }

  async buscarPorId(id: string): Promise<Servico | null> {
    const model = await ServicoModel.find(id, opcoesDeCliente())
    return model ? MapeadorDeServico.paraDominio(model) : null
  }

  async buscarVarios(ids: string[]): Promise<Servico[]> {
    if (ids.length === 0) return []
    const models = await ServicoModel.query(opcoesDeCliente()).whereIn('id', ids)
    return models.map(MapeadorDeServico.paraDominio)
  }

  async listar(): Promise<Servico[]> {
    const models = await ServicoModel.query(opcoesDeCliente()).orderBy('nome', 'asc')
    return models.map(MapeadorDeServico.paraDominio)
  }

  async remover(id: string): Promise<void> {
    const model = await ServicoModel.find(id, opcoesDeCliente())
    if (model) await model.delete()
  }
}
