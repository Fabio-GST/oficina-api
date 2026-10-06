import { RaizAgregado } from '#shared/entities/raiz-agregado'
import { ErroDeValidacao } from '#shared/entities/erros'
import { Dinheiro } from '#shared/entities/objetos-de-valor/dinheiro'
import { QuantidadeEstoque } from './objetos-de-valor/quantidade-estoque.js'
import { SaldoEstoque } from './objetos-de-valor/saldo-estoque.js'
import { PecaCadastrada } from './eventos/peca-cadastrada.js'
import { PecaReservada } from './eventos/peca-reservada.js'
import { PecaUtilizada } from './eventos/peca-utilizada.js'
import { PecaRecebida } from './eventos/peca-recebida.js'
import { EstoqueAbaixoDoMinimo } from './eventos/estoque-abaixo-do-minimo.js'

interface PropsPeca {
  id?: string
  nome: string
  descricao?: string | null
  preco: Dinheiro
  quantidadeEstoque: QuantidadeEstoque
  quantidadeReservada?: number
  estoqueMinimo?: number
}

/**
 * Peça ou insumo utilizado nos serviços. Aggregate root do contexto de Estoque,
 * responsável por manter consistente o saldo (disponível/reservado) e por
 * sinalizar quando o disponível cai abaixo do estoque mínimo.
 */
export class Peca extends RaizAgregado {
  private _nome: string
  private _descricao: string | null
  private _preco: Dinheiro
  private _saldo: SaldoEstoque
  private _estoqueMinimo: number

  private constructor(props: PropsPeca) {
    super(props.id)
    if (!props.nome || props.nome.trim().length === 0) {
      throw new ErroDeValidacao('Nome da peça é obrigatório.')
    }
    if (!Number.isInteger(props.estoqueMinimo ?? 0) || (props.estoqueMinimo ?? 0) < 0) {
      throw new ErroDeValidacao('Estoque mínimo deve ser um inteiro não negativo.')
    }
    this._nome = props.nome
    this._descricao = props.descricao ?? null
    this._preco = props.preco
    this._saldo = SaldoEstoque.criar(props.quantidadeEstoque.valor, props.quantidadeReservada ?? 0)
    this._estoqueMinimo = props.estoqueMinimo ?? 0
  }

  static criar(props: Omit<PropsPeca, 'id'>): Peca {
    const peca = new Peca(props)
    peca.registrarEvento(new PecaCadastrada(peca.id))
    return peca
  }

  static reconstituir(props: PropsPeca & { id: string }): Peca {
    return new Peca(props)
  }

  atualizar(dados: { nome?: string; descricao?: string | null; preco?: Dinheiro }): void {
    if (dados.nome !== undefined) {
      if (dados.nome.trim().length === 0) {
        throw new ErroDeValidacao('Nome da peça é obrigatório.')
      }
      this._nome = dados.nome
    }
    if (dados.descricao !== undefined) this._descricao = dados.descricao
    if (dados.preco !== undefined) this._preco = dados.preco
  }

  /** Reserva unidades para uma OS, bloqueando a quantidade no disponível. */
  reservar(quantidade: number): void {
    this._saldo = this._saldo.reservar(quantidade)
    this.registrarEvento(new PecaReservada(this.id, quantidade))
  }

  /** Libera uma reserva previamente feita, devolvendo ao disponível. */
  liberarReserva(quantidade: number): void {
    this._saldo = this._saldo.liberarReserva(quantidade)
  }

  /** Consome unidades reservadas (baixa efetiva) e checa o nível de estoque. */
  utilizar(quantidade: number): void {
    this._saldo = this._saldo.utilizar(quantidade)
    this.registrarEvento(new PecaUtilizada(this.id, quantidade))
    this.verificarNivel()
  }

  /** Dá baixa direta no disponível (caminho legado usado pela OS até a Fase 2). */
  darBaixa(quantidade: number): void {
    this._saldo = this._saldo.baixarDireto(quantidade)
    this.verificarNivel()
  }

  /** Repõe unidades no disponível (ex.: recebimento de compra). */
  repor(quantidade: number): void {
    this._saldo = this._saldo.repor(quantidade)
  }

  /** Recebe unidades de uma compra: repõe o disponível e registra o evento. */
  receber(quantidade: number): void {
    this._saldo = this._saldo.repor(quantidade)
    this.registrarEvento(new PecaRecebida(this.id, quantidade))
  }

  /** Define o disponível para um valor absoluto. */
  definirEstoque(quantidade: number): void {
    this._saldo = this._saldo.definirDisponivel(quantidade)
    this.verificarNivel()
  }

  /** Define o estoque mínimo (limiar do alerta). */
  definirEstoqueMinimo(quantidade: number): void {
    if (!Number.isInteger(quantidade) || quantidade < 0) {
      throw new ErroDeValidacao('Estoque mínimo deve ser um inteiro não negativo.')
    }
    this._estoqueMinimo = quantidade
    this.verificarNivel()
  }

  /** Emite alerta quando o disponível está abaixo do estoque mínimo. */
  verificarNivel(): void {
    if (this._saldo.disponivel < this._estoqueMinimo) {
      this.registrarEvento(
        new EstoqueAbaixoDoMinimo(this.id, this._saldo.disponivel, this._estoqueMinimo)
      )
    }
  }

  get nome(): string {
    return this._nome
  }

  get descricao(): string | null {
    return this._descricao
  }

  get preco(): Dinheiro {
    return this._preco
  }

  /** Quantidade disponível (livre) — mantém compatibilidade com a API anterior. */
  get quantidadeEstoque(): QuantidadeEstoque {
    return QuantidadeEstoque.criar(this._saldo.disponivel)
  }

  get quantidadeReservada(): number {
    return this._saldo.reservada
  }

  get estoqueMinimo(): number {
    return this._estoqueMinimo
  }
}
