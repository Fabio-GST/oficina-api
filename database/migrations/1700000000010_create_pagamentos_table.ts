import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'pagamentos'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.string('id', 36).primary()
      table.string('ordem_id', 36).notNullable()
      table.integer('total_centavos').unsigned().notNullable()
      table.integer('desconto_centavos').unsigned().notNullable().defaultTo(0)
      table.integer('pago_centavos').unsigned().notNullable().defaultTo(0)
      table.string('status', 20).notNullable()
      table.string('nota_fiscal_numero', 40).nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
