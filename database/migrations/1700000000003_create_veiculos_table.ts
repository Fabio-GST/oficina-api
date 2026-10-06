import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'veiculos'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.string('id', 36).primary()
      table
        .string('cliente_id', 36)
        .notNullable()
        .references('id')
        .inTable('clientes')
        .onDelete('CASCADE')
      table.string('placa', 7).notNullable().unique()
      table.string('marca').notNullable()
      table.string('modelo').notNullable()
      table.integer('ano').notNullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
