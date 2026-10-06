/**
 * Contrato de um Evento de Domínio: algo relevante que aconteceu no domínio
 * e que pode disparar reações em outras partes do sistema.
 */
export interface EventoDeDominio {
  readonly nome: string
  readonly ocorridoEm: Date
}
