import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.createTable('ordens_servico', (table) => {
      table.string('id', 36).primary()
      table
        .string('cliente_id', 36)
        .notNullable()
        .references('id')
        .inTable('clientes')
        .onDelete('RESTRICT')
      table
        .string('veiculo_id', 36)
        .notNullable()
        .references('id')
        .inTable('veiculos')
        .onDelete('RESTRICT')
      table.string('status', 30).notNullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()
    })

    this.schema.createTable('itens_ordem_servico', (table) => {
      table.string('id', 36).primary()
      table
        .string('ordem_id', 36)
        .notNullable()
        .references('id')
        .inTable('ordens_servico')
        .onDelete('CASCADE')
      table.string('tipo', 10).notNullable()
      table.string('referencia_id', 36).notNullable()
      table.string('descricao').notNullable()
      table.integer('preco_unitario_centavos').unsigned().notNullable()
      table.integer('quantidade').unsigned().notNullable()
    })

    this.schema.createTable('historico_status_os', (table) => {
      table.string('id', 36).primary()
      table
        .string('ordem_id', 36)
        .notNullable()
        .references('id')
        .inTable('ordens_servico')
        .onDelete('CASCADE')
      table.string('status', 30).notNullable()
      table.timestamp('ocorrido_em').notNullable()
    })
  }

  async down() {
    this.schema.dropTable('historico_status_os')
    this.schema.dropTable('itens_ordem_servico')
    this.schema.dropTable('ordens_servico')
  }
}
