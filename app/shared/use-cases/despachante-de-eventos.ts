import type { EventoDeDominio } from '#shared/entities/evento-de-dominio'

/**
 * Despachante (publisher) de Eventos de Domínio.
 *
 * Abstrai *como* os eventos chegam aos seus manipuladores. A implementação
 * padrão é um barramento em memória (in-process), mas o contrato permite trocar
 * por uma fila/broker no futuro sem afetar domínio nem aplicação.
 */
export interface DespachanteDeEventos {
  publicar(eventos: EventoDeDominio[]): Promise<void>
}
