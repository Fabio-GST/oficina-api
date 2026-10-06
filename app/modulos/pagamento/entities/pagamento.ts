import { RaizAgregado } from '#shared/entities/raiz-agregado'
import { ErroDeValidacao, RegraDeNegocioViolada } from '#shared/entities/erros'
import { Dinheiro } from '#shared/entities/objetos-de-valor/dinheiro'
import { CobrancaGerada } from './eventos/cobranca-gerada.js'
import { DescontoAplicado } from './eventos/desconto-aplicado.js'
import { PagamentoConfirmado } from './eventos/pagamento-confirmado.js'
import { NotaFiscalEmitida } from './eventos/nota-fiscal-emitida.js'

export enum StatusPagamento {
  PENDENTE = 'PENDENTE',
  PARCIAL = 'PARCIAL',
  QUITADO = 'QUITADO',
}

interface PropsPagamento {
  id?: string
  ordemId: string
  total: Dinheiro
  desconto: Dinheiro
  pago: Dinheiro
  status: StatusPagamento
  notaFiscalNumero?: string | null
}

/**
 * Pagamento de uma Ordem de Serviço. Aggregate root que controla cobrança,
 * desconto, registro de pagamentos e emissão da Nota Fiscal — esta última
 * desacoplada (acionada por Política ao confirmar o pagamento integral).
 */
export class Pagamento extends RaizAgregado {
  private _ordemId: string
  private _total: Dinheiro
  private _desconto: Dinheiro
  private _pago: Dinheiro
  private _status: StatusPagamento
  private _notaFiscalNumero: string | null

  private constructor(props: PropsPagamento) {
    super(props.id)
    this._ordemId = props.ordemId
    this._total = props.total
    this._desconto = props.desconto
    this._pago = props.pago
    this._status = props.status
    this._notaFiscalNumero = props.notaFiscalNumero ?? null
  }

  /** Gera a cobrança de uma OS (estado inicial PENDENTE). */
  static gerarCobranca(props: { ordemId: string; total: Dinheiro }): Pagamento {
    if (props.total.centavos <= 0) {
      throw new ErroDeValidacao('O valor total da cobrança deve ser positivo.')
    }
    const pagamento = new Pagamento({
      ordemId: props.ordemId,
      total: props.total,
      desconto: Dinheiro.zero(),
      pago: Dinheiro.zero(),
      status: StatusPagamento.PENDENTE,
    })
    pagamento.registrarEvento(
      new CobrancaGerada(pagamento.id, pagamento.ordemId, pagamento.total.centavos)
    )
    return pagamento
  }

  static reconstituir(props: PropsPagamento & { id: string }): Pagamento {
    return new Pagamento(props)
  }

  /** Valor efetivamente devido (total menos desconto). */
  valorDevido(): Dinheiro {
    return Dinheiro.deCentavos(this._total.centavos - this._desconto.centavos)
  }

  /** Aplica um desconto sobre o total (não pode exceder o total). */
  aplicarDesconto(desconto: Dinheiro): void {
    this.garantirNaoQuitado()
    if (desconto.centavos > this._total.centavos) {
      throw new RegraDeNegocioViolada('O desconto não pode ser maior que o total.')
    }
    this._desconto = desconto
    this.registrarEvento(new DescontoAplicado(this.id, desconto.centavos))
  }

  /**
   * Registra um pagamento. Quando o acumulado atinge o valor devido, marca como
   * QUITADO e registra `pagamento.confirmado` (pagamento integral).
   */
  registrarPagamento(valor: Dinheiro): void {
    if (valor.centavos <= 0) {
      throw new ErroDeValidacao('O valor do pagamento deve ser positivo.')
    }
    if (this._status === StatusPagamento.QUITADO) {
      throw new RegraDeNegocioViolada('Pagamento já quitado.')
    }
    this._pago = this._pago.somar(valor)
    if (this._pago.centavos >= this.valorDevido().centavos) {
      this._status = StatusPagamento.QUITADO
      this.registrarEvento(
        new PagamentoConfirmado(this.id, this._ordemId, this.valorDevido().centavos)
      )
    } else {
      this._status = StatusPagamento.PARCIAL
    }
  }

  /** Emite a Nota Fiscal (somente após quitação; idempotente). */
  emitirNotaFiscal(numero: string): void {
    if (this._status !== StatusPagamento.QUITADO) {
      throw new RegraDeNegocioViolada('A Nota Fiscal só pode ser emitida após a quitação.')
    }
    if (this._notaFiscalNumero) return
    if (!numero || numero.trim().length === 0) {
      throw new ErroDeValidacao('Número da Nota Fiscal é obrigatório.')
    }
    this._notaFiscalNumero = numero
    this.registrarEvento(new NotaFiscalEmitida(this.id, this._ordemId, numero))
  }

  private garantirNaoQuitado(): void {
    if (this._status === StatusPagamento.QUITADO) {
      throw new RegraDeNegocioViolada('Pagamento já quitado não pode ser alterado.')
    }
  }

  get ordemId(): string {
    return this._ordemId
  }

  get total(): Dinheiro {
    return this._total
  }

  get desconto(): Dinheiro {
    return this._desconto
  }

  get pago(): Dinheiro {
    return this._pago
  }

  get status(): StatusPagamento {
    return this._status
  }

  get notaFiscalNumero(): string | null {
    return this._notaFiscalNumero
  }
}
