'use strict'

/**
 * Configuração do agente APM do New Relic (RFC 0004).
 *
 * O agente é carregado ANTES da aplicação pelo Node (`NODE_OPTIONS="-r newrelic
 * --import newrelic/esm-loader.mjs"`, definido no ConfigMap do Kubernetes). O
 * `-r` inicia o agente; o loader ESM instrumenta os módulos importados com
 * `import` (mysql2, pino, http). As variáveis NEW_RELIC_* do ambiente
 * sobrescrevem qualquer valor daqui.
 *
 * Sem `NEW_RELIC_LICENSE_KEY` (desenvolvimento local e testes) o agente fica
 * DESABILITADO: o `require('newrelic')` devolve uma API no-op e nada é enviado.
 */
const licenseKey = process.env.NEW_RELIC_LICENSE_KEY || ''

exports.config = {
  agent_enabled: licenseKey.length > 0,
  app_name: [process.env.NEW_RELIC_APP_NAME || 'oficina-api-local'],
  license_key: licenseKey,

  /** Traces distribuídos: API Gateway → API → MySQL em um único trace. */
  distributed_tracing: {
    enabled: true,
  },

  /**
   * Os logs JSON do pino já saem no stdout com `trace.id`/`span.id` (enricher em
   * config/logger.ts) e são coletados pelo `newrelic-logging` do nri-bundle
   * (repo oficina-infra-k8s). O encaminhamento pelo agente fica desligado para
   * não duplicar as linhas no painel.
   */
  application_logging: {
    forwarding: { enabled: false },
    local_decorating: { enabled: false },
  },

  /** Log do próprio agente no stdout (o container roda sem usuário root). */
  logging: {
    level: 'info',
    filepath: 'stdout',
  },

  /** Nunca envia cabeçalhos/parâmetros sensíveis como atributos. */
  attributes: {
    exclude: [
      'request.headers.authorization',
      'request.headers.cookie',
      'request.headers.x-webhook-token',
      'request.headers.proxyAuthorization',
      'request.headers.setCookie*',
      'response.headers.cookie',
      'response.headers.setCookie*',
    ],
  },
}
