import { ObjetoDeValor } from '#shared/entities/objeto-de-valor'
import { ErroDeValidacao, RegraDeNegocioViolada } from '#shared/entities/erros'

interface PropsSaldo {
  disponivel: number
  reservada: number
}

/**
 * Saldo de uma peça em estoque, separando a quantidade **disponível** (livre
 * para reserva/venda) da **reservada** (bloqueada para uma OS). Imutável: cada
 * operação retorna um novo saldo, garantindo as invariantes (POL de bloqueio e
 * checagem de saldo).
 */
export class SaldoEstoque extends ObjetoDeValor<PropsSaldo> {
  private constructor(props: PropsSaldo) {
    super(props)
  }

  static criar(disponivel: number, reservada = 0): SaldoEstoque {
    SaldoEstoque.validarInteiroNaoNegativo(disponivel, 'disponível')
    SaldoEstoque.validarInteiroNaoNegativo(reservada, 'reservada')
    return new SaldoEstoque({ disponivel, reservada })
  }

  get disponivel(): number {
    return this.props.disponivel
  }

  get reservada(): number {
    return this.props.reservada
  }

  get total(): number {
    return this.props.disponivel + this.props.reservada
  }

  /** Reserva unidades (POL: bloqueia quantidade — exige saldo disponível). */
  reservar(quantidade: number): SaldoEstoque {
    SaldoEstoque.validarPositivo(quantidade)
    if (quantidade > this.props.disponivel) {
      throw new RegraDeNegocioViolada(
        `Estoque insuficiente para reserva: disponível ${this.props.disponivel}, solicitado ${quantidade}.`
      )
    }
    return SaldoEstoque.criar(this.props.disponivel - quantidade, this.props.reservada + quantidade)
  }

  /** Libera uma reserva, devolvendo as unidades ao disponível. */
  liberarReserva(quantidade: number): SaldoEstoque {
    SaldoEstoque.validarPositivo(quantidade)
    if (quantidade > this.props.reservada) {
      throw new RegraDeNegocioViolada(
        `Reserva insuficiente para liberar: reservada ${this.props.reservada}, solicitado ${quantidade}.`
      )
    }
    return SaldoEstoque.criar(this.props.disponivel + quantidade, this.props.reservada - quantidade)
  }

  /** Consome unidades já reservadas (POL: checagem de saldo reservado). */
  utilizar(quantidade: number): SaldoEstoque {
    SaldoEstoque.validarPositivo(quantidade)
    if (quantidade > this.props.reservada) {
      throw new RegraDeNegocioViolada(
        `Sem reserva suficiente para utilizar: reservada ${this.props.reservada}, solicitado ${quantidade}.`
      )
    }
    return SaldoEstoque.criar(this.props.disponivel, this.props.reservada - quantidade)
  }

  /** Repõe unidades no disponível (ex.: recebimento de compra). */
  repor(quantidade: number): SaldoEstoque {
    SaldoEstoque.validarPositivo(quantidade)
    return SaldoEstoque.criar(this.props.disponivel + quantidade, this.props.reservada)
  }

  /**
   * Baixa direta do disponível, sem passar por reserva (caminho legado usado
   * pela OS até a Fase 2 migrar para reserva→utilização).
   */
  baixarDireto(quantidade: number): SaldoEstoque {
    SaldoEstoque.validarPositivo(quantidade)
    if (quantidade > this.props.disponivel) {
      throw new RegraDeNegocioViolada(
        `Estoque insuficiente: disponível ${this.props.disponivel}, solicitado ${quantidade}.`
      )
    }
    return SaldoEstoque.criar(this.props.disponivel - quantidade, this.props.reservada)
  }

  /** Define o disponível para um valor absoluto, mantendo as reservas. */
  definirDisponivel(quantidade: number): SaldoEstoque {
    return SaldoEstoque.criar(quantidade, this.props.reservada)
  }

  private static validarInteiroNaoNegativo(valor: number, rotulo: string): void {
    if (!Number.isInteger(valor) || valor < 0) {
      throw new ErroDeValidacao(`Quantidade ${rotulo} deve ser um inteiro não negativo.`)
    }
  }

  private static validarPositivo(valor: number): void {
    if (!Number.isInteger(valor) || valor <= 0) {
      throw new ErroDeValidacao('A quantidade deve ser um inteiro positivo.')
    }
  }
}
