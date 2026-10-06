import { randomUUID } from 'node:crypto'

/**
 * Base para Entidades do domínio.
 *
 * Uma Entidade possui identidade própria (o `id`) que a distingue mesmo quando
 * os seus atributos mudam ao longo do tempo. O `id` é um UUID gerado no domínio,
 * mantendo a entidade independente do banco de dados.
 */
export abstract class Entidade {
  protected readonly _id: string

  protected constructor(id?: string) {
    this._id = id ?? randomUUID()
  }

  get id(): string {
    return this._id
  }

  /**
   * Duas entidades são iguais quando têm o mesmo identificador.
   */
  public iguala(outra?: Entidade): boolean {
    if (outra === null || outra === undefined) {
      return false
    }
    return this._id === outra._id
  }
}
