import { Entidade } from './entidade.js'
import { EventoDeDominio } from './evento-de-dominio.js'

/**
 * Base para Raízes de Agregado (Aggregate Roots).
 *
 * A raiz é o único ponto de entrada para o agregado e garante a consistência
 * das suas invariantes. Também acumula Eventos de Domínio que podem ser
 * publicados após a persistência.
 */
export abstract class RaizAgregado extends Entidade {
  private readonly _eventos: EventoDeDominio[] = []

  protected registrarEvento(evento: EventoDeDominio): void {
    this._eventos.push(evento)
  }

  /**
   * Retorna e limpa os eventos acumulados (consumo único).
   */
  public extrairEventos(): EventoDeDominio[] {
    const eventos = [...this._eventos]
    this._eventos.length = 0
    return eventos
  }
}
