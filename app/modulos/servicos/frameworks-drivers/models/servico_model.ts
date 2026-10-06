import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class ServicoModel extends BaseModel {
  static table = 'servicos'
  static selfAssignPrimaryKey = true

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare nome: string

  @column()
  declare descricao: string | null

  /** Preço em centavos. */
  @column()
  declare precoCentavos: number

  @column()
  declare ativo: boolean

  @column()
  declare tempoEstimadoMinutos: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
