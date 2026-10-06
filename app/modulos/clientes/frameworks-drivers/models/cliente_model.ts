import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class ClienteModel extends BaseModel {
  static table = 'clientes'
  static selfAssignPrimaryKey = true

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare nome: string

  @column()
  declare documento: string

  @column()
  declare tipoDocumento: string

  @column()
  declare telefone: string | null

  @column()
  declare email: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
