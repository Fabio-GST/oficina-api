import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'servicos'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.boolean('ativo').notNullable().defaultTo(true)
      table.integer('tempo_estimado_minutos').unsigned().nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('ativo')
      table.dropColumn('tempo_estimado_minutos')
    })
  }
}
