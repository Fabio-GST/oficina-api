import type { EventoDeDominio } from '#shared/entities/evento-de-dominio'

/**
 * Manipulador (handler) de um Evento de Domínio: reage a algo que aconteceu,
 * normalmente disparando um comando em outro contexto (uma Política / POL).
 *
 * `evento` é o nome do evento ao qual o manipulador se inscreve (ex.:
 * `'ordem-servico.aprovada'`), casando com `EventoDeDominio.nome`.
 */
export interface ManipuladorDeEvento<E extends EventoDeDominio = EventoDeDominio> {
  readonly evento: string
  manipular(evento: E): Promise<void>
}
