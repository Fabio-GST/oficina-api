import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class VeiculoModel extends BaseModel {
  static table = 'veiculos'
  static selfAssignPrimaryKey = true

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare clienteId: string

  @column()
  declare placa: string

  @column()
  declare marca: string

  @column()
  declare modelo: string

  @column()
  declare ano: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
