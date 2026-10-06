import { ObjetoDeValor } from '../objeto-de-valor.js'
import { ErroDeValidacao } from '../erros.js'

interface PropsDinheiro {
  centavos: number
}

/**
 * Valor monetário em Reais, armazenado internamente em centavos (inteiro) para
 * evitar erros de ponto flutuante em cálculos de orçamento.
 */
export class Dinheiro extends ObjetoDeValor<PropsDinheiro> {
  private constructor(props: PropsDinheiro) {
    super(props)
  }

  /** Cria a partir de um valor em centavos (inteiro não negativo). */
  static deCentavos(centavos: number): Dinheiro {
    if (!Number.isInteger(centavos) || centavos < 0) {
      throw new ErroDeValidacao('Valor monetário deve ser um inteiro de centavos não negativo.')
    }
    return new Dinheiro({ centavos })
  }

  /** Cria a partir de um valor em Reais (ex.: 99.90). */
  static deReais(reais: number): Dinheiro {
    if (typeof reais !== 'number' || Number.isNaN(reais) || reais < 0) {
      throw new ErroDeValidacao('Valor monetário deve ser um número não negativo.')
    }
    return new Dinheiro({ centavos: Math.round(reais * 100) })
  }

  static zero(): Dinheiro {
    return new Dinheiro({ centavos: 0 })
  }

  get centavos(): number {
    return this.props.centavos
  }

  get reais(): number {
    return this.props.centavos / 100
  }

  somar(outro: Dinheiro): Dinheiro {
    return new Dinheiro({ centavos: this.props.centavos + outro.props.centavos })
  }

  multiplicar(fator: number): Dinheiro {
    if (!Number.isInteger(fator) || fator < 0) {
      throw new ErroDeValidacao('Fator de multiplicação deve ser um inteiro não negativo.')
    }
    return new Dinheiro({ centavos: this.props.centavos * fator })
  }
}
