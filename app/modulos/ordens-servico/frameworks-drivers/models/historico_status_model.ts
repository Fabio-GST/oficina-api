import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class HistoricoStatusModel extends BaseModel {
  static table = 'historico_status_os'
  static selfAssignPrimaryKey = true

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare ordemId: string

  @column()
  declare status: string

  @column.dateTime()
  declare ocorridoEm: DateTime
}
