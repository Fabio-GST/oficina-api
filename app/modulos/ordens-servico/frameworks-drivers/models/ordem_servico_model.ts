import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import ItemOrdemServicoModel from './item_ordem_servico_model.js'
import HistoricoStatusModel from './historico_status_model.js'

export default class OrdemServicoModel extends BaseModel {
  static table = 'ordens_servico'
  static selfAssignPrimaryKey = true

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare clienteId: string

  @column()
  declare veiculoId: string

  @column()
  declare status: string

  @column()
  declare prioridade: string

  @hasMany(() => ItemOrdemServicoModel, { foreignKey: 'ordemId' })
  declare itens: HasMany<typeof ItemOrdemServicoModel>

  @hasMany(() => HistoricoStatusModel, { foreignKey: 'ordemId' })
  declare historico: HasMany<typeof HistoricoStatusModel>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
