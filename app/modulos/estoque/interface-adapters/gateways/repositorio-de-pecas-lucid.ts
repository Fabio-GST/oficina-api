import { opcoesDeCliente } from '#shared/frameworks-drivers/contexto-transacional'
import type { RepositorioDePecas } from '../../use-cases/ports/repositorio-de-pecas.js'
import type { Peca } from '../../entities/peca.js'
import PecaModel from '../../frameworks-drivers/models/peca_model.js'
import { MapeadorDePeca } from './mapeador-de-peca.js'

export class RepositorioDePecasLucid implements RepositorioDePecas {
  async salvar(peca: Peca): Promise<void> {
    const dados = MapeadorDePeca.paraPersistencia(peca)
    await PecaModel.updateOrCreate({ id: dados.id }, dados, opcoesDeCliente())
  }

  async buscarPorId(id: string): Promise<Peca | null> {
    const model = await PecaModel.find(id, opcoesDeCliente())
    return model ? MapeadorDePeca.paraDominio(model) : null
  }

  async buscarVarias(ids: string[]): Promise<Peca[]> {
    if (ids.length === 0) return []
    const models = await PecaModel.query(opcoesDeCliente()).whereIn('id', ids)
    return models.map(MapeadorDePeca.paraDominio)
  }

  async listar(): Promise<Peca[]> {
    const models = await PecaModel.query(opcoesDeCliente()).orderBy('nome', 'asc')
    return models.map(MapeadorDePeca.paraDominio)
  }

  async remover(id: string): Promise<void> {
    const model = await PecaModel.find(id, opcoesDeCliente())
    if (model) await model.delete()
  }
}
