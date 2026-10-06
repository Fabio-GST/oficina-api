import { ObjetoDeValor } from '#shared/entities/objeto-de-valor'
import { ErroDeValidacao } from '#shared/entities/erros'

// Formato antigo: AAA9999 | Formato Mercosul: AAA9A99
const FORMATO_ANTIGO = /^[A-Z]{3}\d{4}$/
const FORMATO_MERCOSUL = /^[A-Z]{3}\d[A-Z]\d{2}$/

interface PropsPlaca {
  valor: string
}

/** Placa de veículo brasileira (modelo antigo ou Mercosul), normalizada. */
export class Placa extends ObjetoDeValor<PropsPlaca> {
  private constructor(props: PropsPlaca) {
    super(props)
  }

  static criar(valor: string): Placa {
    const normalizada = (valor ?? '').toUpperCase().replace(/[\s-]/g, '')
    if (!FORMATO_ANTIGO.test(normalizada) && !FORMATO_MERCOSUL.test(normalizada)) {
      throw new ErroDeValidacao(`Placa inválida: ${valor}`)
    }
    return new Placa({ valor: normalizada })
  }

  get valor(): string {
    return this.props.valor
  }
}
