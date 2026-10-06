import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

/** Model Lucid da tabela `usuarios`. Pertence apenas à camada de infraestrutura. */
export default class UsuarioModel extends BaseModel {
  static table = 'usuarios'
  static selfAssignPrimaryKey = true

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare nome: string

  @column()
  declare email: string

  @column({ serializeAs: null })
  declare senhaHash: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
