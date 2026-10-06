import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'ordens_servico'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('prioridade', 10).notNullable().defaultTo('NORMAL')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('prioridade')
    })
  }
}
