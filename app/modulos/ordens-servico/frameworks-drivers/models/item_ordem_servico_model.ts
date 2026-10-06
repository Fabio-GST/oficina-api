import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class ItemOrdemServicoModel extends BaseModel {
  static table = 'itens_ordem_servico'
  static selfAssignPrimaryKey = true

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare ordemId: string

  @column()
  declare tipo: string

  @column()
  declare referenciaId: string

  @column()
  declare descricao: string

  @column()
  declare precoUnitarioCentavos: number

  @column()
  declare quantidade: number
}
