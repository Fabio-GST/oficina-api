import { DateTime } from 'luxon'
import { RaizAgregado } from '#shared/entities/raiz-agregado'
import { ErroDeValidacao, RegraDeNegocioViolada } from '#shared/entities/erros'
import { CompraSolicitada } from './eventos/compra-solicitada.js'

export enum StatusSolicitacao {
  SOLICITADA = 'SOLICITADA',
  RECEBIDA = 'RECEBIDA',
}

interface PropsSolicitacao {
  id?: string
  pecaId: string
  quantidade: number
  status: StatusSolicitacao
  criadaEm: DateTime
  recebidaEm?: DateTime | null
}

/**
 * Solicitação de compra de uma peça ao fornecedor. Aggregate root simples que
 * acompanha o ciclo Solicitada → Recebida.
 */
export class SolicitacaoDeCompra extends RaizAgregado {
  private _pecaId: string
  private _quantidade: number
  private _status: StatusSolicitacao
  private _criadaEm: DateTime
  private _recebidaEm: DateTime | null

  private constructor(props: PropsSolicitacao) {
    super(props.id)
    this._pecaId = props.pecaId
    this._quantidade = props.quantidade
    this._status = props.status
    this._criadaEm = props.criadaEm
    this._recebidaEm = props.recebidaEm ?? null
  }

  static criar(props: { pecaId: string; quantidade: number }): SolicitacaoDeCompra {
    if (!Number.isInteger(props.quantidade) || props.quantidade <= 0) {
      throw new ErroDeValidacao('Quantidade da compra deve ser um inteiro positivo.')
    }
    const solicitacao = new SolicitacaoDeCompra({
      pecaId: props.pecaId,
      quantidade: props.quantidade,
      status: StatusSolicitacao.SOLICITADA,
      criadaEm: DateTime.now(),
    })
    solicitacao.registrarEvento(
      new CompraSolicitada(solicitacao.id, solicitacao.pecaId, solicitacao.quantidade)
    )
    return solicitacao
  }

  static reconstituir(props: PropsSolicitacao & { id: string }): SolicitacaoDeCompra {
    return new SolicitacaoDeCompra(props)
  }

  /** Marca a solicitação como recebida. */
  receber(): void {
    if (this._status === StatusSolicitacao.RECEBIDA) {
      throw new RegraDeNegocioViolada('Solicitação de compra já recebida.')
    }
    this._status = StatusSolicitacao.RECEBIDA
    this._recebidaEm = DateTime.now()
  }

  get pecaId(): string {
    return this._pecaId
  }

  get quantidade(): number {
    return this._quantidade
  }

  get status(): StatusSolicitacao {
    return this._status
  }

  get criadaEm(): DateTime {
    return this._criadaEm
  }

  get recebidaEm(): DateTime | null {
    return this._recebidaEm
  }
}
