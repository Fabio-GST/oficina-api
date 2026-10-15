import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Status do cliente. A Function de autenticação por CPF (repo oficina-auth-lambda)
 * consulta `ativo` antes de emitir o JWT: cliente inativo não se autentica.
 */
export default class extends BaseSchema {
  protected tableName = 'clientes'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.boolean('ativo').notNullable().defaultTo(true)
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('ativo')
    })
  }
}
