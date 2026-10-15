/** Nomes dos eventos de negócio enviados à plataforma de observabilidade (RFC 0004). */
export type NomeEventoDeTelemetria =
  | 'OrdemServicoCriada'
  | 'OrdemServicoMudouStatus'
  | 'IntegracaoFalhou'

/** Integrações externas cujas falhas são contabilizadas no painel. */
export type IntegracaoExterna = 'email' | 'webhook'

/** Atributos de um evento: apenas escalares, como exigem os backends de eventos. */
export type AtributosDeTelemetria = Record<string, string | number | boolean>

/**
 * Porta de telemetria de negócio. Permite que Políticas e adaptadores registrem
 * eventos para dashboards e alertas (volume diário de OS, tempo por status,
 * falhas nas integrações) sem conhecer o fornecedor. A implementação real
 * (New Relic) vive na infraestrutura; testes e ambiente local usam
 * {@link TelemetriaNula}.
 */
export interface Telemetria {
  registrarEvento(nome: NomeEventoDeTelemetria, atributos: AtributosDeTelemetria): void
}

/** Implementação no-op: descarta os eventos (testes, desenvolvimento sem license key). */
export class TelemetriaNula implements Telemetria {
  registrarEvento(_nome: NomeEventoDeTelemetria, _atributos: AtributosDeTelemetria): void {}
}

/** Extrai uma mensagem curta e serializável de qualquer erro, para o atributo `erro`. */
export function descreverErro(erro: unknown): string {
  if (erro instanceof Error) return `${erro.name}: ${erro.message}`
  return String(erro)
}
