import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class PagamentoModel extends BaseModel {
  static table = 'pagamentos'
  static selfAssignPrimaryKey = true

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare ordemId: string

  @column()
  declare totalCentavos: number

  @column()
  declare descontoCentavos: number

  @column()
  declare pagoCentavos: number

  @column()
  declare status: string

  @column()
  declare notaFiscalNumero: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
