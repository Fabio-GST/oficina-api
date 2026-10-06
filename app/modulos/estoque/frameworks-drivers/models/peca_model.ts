import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class PecaModel extends BaseModel {
  static table = 'pecas'
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
  declare quantidadeEstoque: number

  @column()
  declare quantidadeReservada: number

  @column()
  declare estoqueMinimo: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
