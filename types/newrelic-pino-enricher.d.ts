/**
 * O @newrelic/pino-enricher não publica tipos. Ele devolve opções do pino
 * (mixin, formatters, timestamp, messageKey) — ou `{}` com o agente desligado.
 */
declare module '@newrelic/pino-enricher' {
  interface OpcoesDoEnriquecedor {
    mixin?: () => Record<string, unknown>
    formatters?: { log?: (objeto: Record<string, unknown>) => Record<string, unknown> }
    messageKey?: string
    timestamp?: () => string
  }
  function nrPino(): OpcoesDoEnriquecedor
  export default nrPino
}
