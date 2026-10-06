import { RaizAgregado } from '#shared/entities/raiz-agregado'
import { ErroDeValidacao, RegraDeNegocioViolada } from '#shared/entities/erros'
import { Dinheiro } from '#shared/entities/objetos-de-valor/dinheiro'
import { ServicoCadastrado } from './eventos/servico-cadastrado.js'
import { ServicoInativado } from './eventos/servico-inativado.js'
import { PrecoDeServicoAtualizado } from './eventos/preco-de-servico-atualizado.js'

interface PropsServico {
  id?: string
  nome: string
  descricao?: string | null
  preco: Dinheiro
  ativo?: boolean
  tempoEstimadoMinutos?: number | null
}

/** Serviço oferecido pela oficina (ex.: troca de óleo). Aggregate root. */
export class Servico extends RaizAgregado {
  private _nome: string
  private _descricao: string | null
  private _preco: Dinheiro
  private _ativo: boolean
  private _tempoEstimadoMinutos: number | null

  private constructor(props: PropsServico) {
    super(props.id)
    if (!props.nome || props.nome.trim().length === 0) {
      throw new ErroDeValidacao('Nome do serviço é obrigatório.')
    }
    if (props.tempoEstimadoMinutos !== null && props.tempoEstimadoMinutos !== undefined) {
      Servico.validarTempo(props.tempoEstimadoMinutos)
    }
    this._nome = props.nome
    this._descricao = props.descricao ?? null
    this._preco = props.preco
    this._ativo = props.ativo ?? true
    this._tempoEstimadoMinutos = props.tempoEstimadoMinutos ?? null
  }

  static criar(props: Omit<PropsServico, 'id' | 'ativo'>): Servico {
    const servico = new Servico(props)
    servico.registrarEvento(new ServicoCadastrado(servico.id))
    return servico
  }

  static reconstituir(props: PropsServico & { id: string }): Servico {
    return new Servico(props)
  }

  atualizar(dados: { nome?: string; descricao?: string | null; preco?: Dinheiro }): void {
    this.garantirAtivo()
    if (dados.nome !== undefined) {
      if (dados.nome.trim().length === 0) {
        throw new ErroDeValidacao('Nome do serviço é obrigatório.')
      }
      this._nome = dados.nome
    }
    if (dados.descricao !== undefined) this._descricao = dados.descricao
    if (dados.preco !== undefined) this.atualizarPreco(dados.preco)
  }

  /** Atualiza o preço da tabela, registrando o evento correspondente. */
  atualizarPreco(preco: Dinheiro): void {
    this.garantirAtivo()
    this._preco = preco
    this.registrarEvento(new PrecoDeServicoAtualizado(this.id, preco.centavos))
  }

  /** Define o tempo estimado de execução (em minutos). */
  definirTempoEstimado(minutos: number): void {
    this.garantirAtivo()
    Servico.validarTempo(minutos)
    this._tempoEstimadoMinutos = minutos
  }

  /** Inativa o serviço: bloqueia sua inclusão em novas Ordens de Serviço. */
  inativar(): void {
    if (!this._ativo) return
    this._ativo = false
    this.registrarEvento(new ServicoInativado(this.id))
  }

  /** Reativa um serviço previamente inativado. */
  reativar(): void {
    this._ativo = true
  }

  private garantirAtivo(): void {
    if (!this._ativo) {
      throw new RegraDeNegocioViolada('Serviço inativo não pode ser alterado.')
    }
  }

  private static validarTempo(minutos: number): void {
    if (!Number.isInteger(minutos) || minutos <= 0) {
      throw new ErroDeValidacao('Tempo estimado deve ser um inteiro positivo (minutos).')
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

  get ativo(): boolean {
    return this._ativo
  }

  get tempoEstimadoMinutos(): number | null {
    return this._tempoEstimadoMinutos
  }
}
