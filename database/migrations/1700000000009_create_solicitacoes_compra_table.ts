import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'solicitacoes_compra'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.string('id', 36).primary()
      table.string('peca_id', 36).notNullable().references('id').inTable('pecas')
      table.integer('quantidade').unsigned().notNullable()
      table.string('status', 20).notNullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('recebida_em').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
