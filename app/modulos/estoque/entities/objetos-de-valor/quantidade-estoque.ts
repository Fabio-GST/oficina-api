import { ObjetoDeValor } from '#shared/entities/objeto-de-valor'
import { ErroDeValidacao, RegraDeNegocioViolada } from '#shared/entities/erros'

interface PropsQuantidade {
  valor: number
}

/** Quantidade de uma peça em estoque: inteiro não negativo. */
export class QuantidadeEstoque extends ObjetoDeValor<PropsQuantidade> {
  private constructor(props: PropsQuantidade) {
    super(props)
  }

  static criar(valor: number): QuantidadeEstoque {
    if (!Number.isInteger(valor) || valor < 0) {
      throw new ErroDeValidacao('Quantidade em estoque deve ser um inteiro não negativo.')
    }
    return new QuantidadeEstoque({ valor })
  }

  get valor(): number {
    return this.props.valor
  }

  somar(quantidade: number): QuantidadeEstoque {
    return QuantidadeEstoque.criar(this.props.valor + quantidade)
  }

  /** Dá baixa, garantindo que não fica negativo. */
  subtrair(quantidade: number): QuantidadeEstoque {
    if (quantidade > this.props.valor) {
      throw new RegraDeNegocioViolada(
        `Estoque insuficiente: disponível ${this.props.valor}, solicitado ${quantidade}.`
      )
    }
    return QuantidadeEstoque.criar(this.props.valor - quantidade)
  }
}
