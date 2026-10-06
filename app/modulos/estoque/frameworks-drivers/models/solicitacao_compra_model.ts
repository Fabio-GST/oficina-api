import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class SolicitacaoCompraModel extends BaseModel {
  static table = 'solicitacoes_compra'
  static selfAssignPrimaryKey = true

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare pecaId: string

  @column()
  declare quantidade: number

  @column()
  declare status: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime()
  declare recebidaEm: DateTime | null
}
