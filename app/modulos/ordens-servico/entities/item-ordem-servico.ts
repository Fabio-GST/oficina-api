import { Entidade } from '#shared/entities/entidade'
import { ErroDeValidacao } from '#shared/entities/erros'
import { Dinheiro } from '#shared/entities/objetos-de-valor/dinheiro'

export type TipoItem = 'SERVICO' | 'PECA'

interface PropsItem {
  id?: string
  tipo: TipoItem
  referenciaId: string
  descricao: string
  precoUnitario: Dinheiro
  quantidade: number
}

/**
 * Item de uma Ordem de Serviço: um serviço executado ou uma peça aplicada.
 * Faz parte do agregado OrdemServico (não é raiz).
 */
export class ItemOrdemServico extends Entidade {
  private _tipo: TipoItem
  private _referenciaId: string
  private _descricao: string
  private _precoUnitario: Dinheiro
  private _quantidade: number

  private constructor(props: PropsItem) {
    super(props.id)
    if (!Number.isInteger(props.quantidade) || props.quantidade <= 0) {
      throw new ErroDeValidacao('Quantidade do item deve ser um inteiro positivo.')
    }
    this._tipo = props.tipo
    this._referenciaId = props.referenciaId
    this._descricao = props.descricao
    this._precoUnitario = props.precoUnitario
    this._quantidade = props.quantidade
  }

  static criar(props: Omit<PropsItem, 'id'>): ItemOrdemServico {
    return new ItemOrdemServico(props)
  }

  static reconstituir(props: PropsItem & { id: string }): ItemOrdemServico {
    return new ItemOrdemServico(props)
  }

  get tipo(): TipoItem {
    return this._tipo
  }

  get referenciaId(): string {
    return this._referenciaId
  }

  get descricao(): string {
    return this._descricao
  }

  get precoUnitario(): Dinheiro {
    return this._precoUnitario
  }

  get quantidade(): number {
    return this._quantidade
  }

  /** Subtotal do item (preço unitário × quantidade). */
  get subtotal(): Dinheiro {
    return this._precoUnitario.multiplicar(this._quantidade)
  }
}
