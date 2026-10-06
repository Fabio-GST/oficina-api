import { ObjetoDeValor } from '#shared/entities/objeto-de-valor'
import { ErroDeValidacao } from '#shared/entities/erros'

// Quantificadores limitados (RFC 5321) evitam backtracking super-linear (ReDoS).
const FORMATO_EMAIL = /^[^\s@]{1,64}@[^\s@]{1,253}\.[^\s@]{2,63}$/

interface PropsEmail {
  valor: string
}

/** E-mail do usuário administrativo, validado quanto ao formato. */
export class Email extends ObjetoDeValor<PropsEmail> {
  private constructor(props: PropsEmail) {
    super(props)
  }

  static criar(valor: string): Email {
    const normalizado = valor.trim().toLowerCase()
    if (!FORMATO_EMAIL.test(normalizado)) {
      throw new ErroDeValidacao(`E-mail inválido: ${valor}`)
    }
    return new Email({ valor: normalizado })
  }

  get valor(): string {
    return this.props.valor
  }

  toString(): string {
    return this.props.valor
  }
}
