import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'pecas'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('quantidade_reservada').unsigned().notNullable().defaultTo(0)
      table.integer('estoque_minimo').unsigned().notNullable().defaultTo(0)
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('quantidade_reservada')
      table.dropColumn('estoque_minimo')
    })
  }
}
