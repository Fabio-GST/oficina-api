/*
|--------------------------------------------------------------------------
| Environment variables service
|--------------------------------------------------------------------------
|
| The `Env.create` method creates an instance of the Env service. The
| service validates the environment variables and also cast values
| to JavaScript data types.
|
*/

import { Env } from '@adonisjs/core/env'

export default await Env.create(new URL('../', import.meta.url), {
  NODE_ENV: Env.schema.enum(['development', 'production', 'test'] as const),
  PORT: Env.schema.number(),
  APP_KEY: Env.schema.string(),
  HOST: Env.schema.string({ format: 'host' }),
  LOG_LEVEL: Env.schema.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']),

  /*
  |----------------------------------------------------------
  | Variables for configuring database connection
  |----------------------------------------------------------
  */
  DB_CONNECTION: Env.schema.enum.optional(['mysql', 'sqlite'] as const),
  DB_HOST: Env.schema.string({ format: 'host' }),
  DB_PORT: Env.schema.number(),
  DB_USER: Env.schema.string(),
  DB_PASSWORD: Env.schema.string.optional(),
  DB_DATABASE: Env.schema.string(),

  /*
  |----------------------------------------------------------
  | Variables for configuring JWT authentication
  |----------------------------------------------------------
  */
  JWT_SECRET: Env.schema.string(),
  JWT_EXPIRES_IN: Env.schema.string.optional(),

  /*
  |----------------------------------------------------------
  | Segredo dos webhooks (notificações de sistemas externos)
  |----------------------------------------------------------
  */
  WEBHOOK_SECRET: Env.schema.string.optional(),

  /*
  |----------------------------------------------------------
  | Notificação ao cliente (log em dev/test; e-mail via SMTP)
  |----------------------------------------------------------
  */
  NOTIFICACAO_DRIVER: Env.schema.enum.optional(['log', 'email'] as const),
  SMTP_HOST: Env.schema.string.optional(),
  SMTP_PORT: Env.schema.number.optional(),
  SMTP_USER: Env.schema.string.optional(),
  SMTP_PASSWORD: Env.schema.string.optional(),
  MAIL_FROM: Env.schema.string.optional(),
  EMAIL_ALMOXARIFE: Env.schema.string.optional(),
})
