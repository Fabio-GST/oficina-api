import env from '#start/env'
import { defineConfig } from '@adonisjs/lucid'

/**
 * A conexão padrão é MySQL (produção/dev). Nos testes usamos SQLite em memória
 * (rápido e autocontido) selecionando `DB_CONNECTION=sqlite` no `.env.test`.
 */
const dbConfig = defineConfig({
  connection: env.get('DB_CONNECTION', 'mysql'),
  connections: {
    mysql: {
      client: 'mysql2',
      connection: {
        host: env.get('DB_HOST'),
        port: env.get('DB_PORT'),
        user: env.get('DB_USER'),
        password: env.get('DB_PASSWORD'),
        database: env.get('DB_DATABASE'),
      },
      migrations: {
        naturalSort: true,
        paths: ['database/migrations'],
      },
    },

    sqlite: {
      client: 'better-sqlite3',
      connection: { filename: ':memory:' },
      useNullAsDefault: true,
      // Uma única conexão persistente para o banco :memory: sobreviver entre
      // as queries, com as foreign keys habilitadas (SQLite exige por conexão).
      pool: {
        min: 1,
        max: 1,
        afterCreate: (conn: any, done: any) => {
          conn.prepare('PRAGMA foreign_keys = ON').run()
          done(null, conn)
        },
      },
      migrations: {
        naturalSort: true,
        paths: ['database/migrations'],
      },
    },
  },
})

export default dbConfig
