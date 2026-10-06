/**
 * Base para Objetos de Valor (Value Objects).
 *
 * Um Objeto de Valor é imutável e a sua identidade é definida pelos seus
 * atributos (igualdade estrutural), e não por um identificador.
 */
export abstract class ObjetoDeValor<T extends object> {
  protected readonly props: T

  protected constructor(props: T) {
    this.props = Object.freeze(props)
  }

  /**
   * Dois objetos de valor são iguais quando todos os seus atributos são iguais.
   */
  public iguala(outro?: ObjetoDeValor<T>): boolean {
    if (outro === null || outro === undefined) {
      return false
    }
    if (outro.constructor !== this.constructor) {
      return false
    }
    return JSON.stringify(this.props) === JSON.stringify(outro.props)
  }
}
