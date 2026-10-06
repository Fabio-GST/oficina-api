import { DateTime } from 'luxon'
import { RaizAgregado } from '#shared/entities/raiz-agregado'
import { RegraDeNegocioViolada } from '#shared/entities/erros'
import { Dinheiro } from '#shared/entities/objetos-de-valor/dinheiro'
import { StatusOrdemServico, StatusOS } from './objetos-de-valor/status-ordem-servico.js'
import { PrioridadeOS } from './objetos-de-valor/prioridade-os.js'
import { ItemOrdemServico, type TipoItem } from './item-ordem-servico.js'
import { CalculadoraOrcamento } from './servicos/calculadora-orcamento.js'
import { OrdemServicoAberta } from './eventos/ordem-servico-aberta.js'
import { DiagnosticoIniciado } from './eventos/diagnostico-iniciado.js'
import { OrcamentoGerado } from './eventos/orcamento-gerado.js'
import { OrdemServicoAprovada } from './eventos/ordem-servico-aprovada.js'
import { OrdemServicoRecusada } from './eventos/ordem-servico-recusada.js'
import { OrdemServicoFinalizada } from './eventos/ordem-servico-finalizada.js'
import { VeiculoEntregue } from './eventos/veiculo-entregue.js'

export interface RegistroStatus {
  status: StatusOS
  ocorridoEm: DateTime
}

interface PropsOrdemServico {
  id?: string
  clienteId: string
  veiculoId: string
  status: StatusOrdemServico
  prioridade: PrioridadeOS
  itens: ItemOrdemServico[]
  historico: RegistroStatus[]
  criadaEm: DateTime
}

/** Estados em que a OS ainda pode ter seus itens/orçamento alterados. */
const STATUS_EDITAVEIS: StatusOS[] = [
  StatusOS.RECEBIDA,
  StatusOS.EM_DIAGNOSTICO,
  StatusOS.AGUARDANDO_APROVACAO,
]

/**
 * Ordem de Serviço (OS): aggregate root do núcleo do sistema. Garante as
 * invariantes do ciclo de vida — composição do orçamento, máquina de estados e
 * registro do histórico para cálculo de métricas.
 */
export class OrdemServico extends RaizAgregado {
  private _clienteId: string
  private _veiculoId: string
  private _status: StatusOrdemServico
  private _prioridade: PrioridadeOS
  private _itens: ItemOrdemServico[]
  private _historico: RegistroStatus[]
  private _criadaEm: DateTime

  private constructor(props: PropsOrdemServico) {
    super(props.id)
    this._clienteId = props.clienteId
    this._veiculoId = props.veiculoId
    this._status = props.status
    this._prioridade = props.prioridade
    this._itens = props.itens
    this._historico = props.historico
    this._criadaEm = props.criadaEm
  }

  /** Abre uma nova OS no estado RECEBIDA. */
  static criar(props: {
    clienteId: string
    veiculoId: string
    prioridade?: PrioridadeOS
  }): OrdemServico {
    const agora = DateTime.now()
    const status = StatusOrdemServico.inicial()
    const ordem = new OrdemServico({
      clienteId: props.clienteId,
      veiculoId: props.veiculoId,
      status,
      prioridade: props.prioridade ?? PrioridadeOS.NORMAL,
      itens: [],
      historico: [{ status: status.valor, ocorridoEm: agora }],
      criadaEm: agora,
    })
    ordem.registrarEvento(new OrdemServicoAberta(ordem.id, ordem.clienteId, ordem.veiculoId))
    return ordem
  }

  static reconstituir(props: PropsOrdemServico & { id: string }): OrdemServico {
    return new OrdemServico(props)
  }

  private garantirEditavel(): void {
    if (!STATUS_EDITAVEIS.includes(this._status.valor)) {
      throw new RegraDeNegocioViolada(`A OS não pode ser alterada no status ${this._status.valor}.`)
    }
  }

  adicionarServico(dados: {
    servicoId: string
    descricao: string
    precoUnitario: Dinheiro
    quantidade: number
  }): ItemOrdemServico {
    return this.adicionarItem(
      'SERVICO',
      dados.servicoId,
      dados.descricao,
      dados.precoUnitario,
      dados.quantidade
    )
  }

  adicionarPeca(dados: {
    pecaId: string
    descricao: string
    precoUnitario: Dinheiro
    quantidade: number
  }): ItemOrdemServico {
    return this.adicionarItem(
      'PECA',
      dados.pecaId,
      dados.descricao,
      dados.precoUnitario,
      dados.quantidade
    )
  }

  private adicionarItem(
    tipo: TipoItem,
    referenciaId: string,
    descricao: string,
    precoUnitario: Dinheiro,
    quantidade: number
  ): ItemOrdemServico {
    this.garantirEditavel()
    const item = ItemOrdemServico.criar({
      tipo,
      referenciaId,
      descricao,
      precoUnitario,
      quantidade,
    })
    this._itens.push(item)
    return item
  }

  /** Orçamento atual da OS (soma dos itens). */
  orcamento(): Dinheiro {
    return CalculadoraOrcamento.calcular(this._itens)
  }

  /** Altera o status respeitando a máquina de estados e registra o histórico. */
  transitarPara(novo: StatusOS): void {
    this._status = this._status.transitarPara(novo)
    this._historico.push({ status: novo, ocorridoEm: DateTime.now() })
  }

  /** Inicia o diagnóstico: RECEBIDA → EM_DIAGNOSTICO. */
  iniciarDiagnostico(): void {
    this.transitarPara(StatusOS.EM_DIAGNOSTICO)
    this.registrarEvento(new DiagnosticoIniciado(this.id))
  }

  /** Gera o orçamento e envia para aprovação: EM_DIAGNOSTICO → AGUARDANDO_APROVACAO. */
  gerarOrcamento(): void {
    if (this._itens.length === 0) {
      throw new RegraDeNegocioViolada('Não é possível gerar orçamento de uma OS sem itens.')
    }
    this.transitarPara(StatusOS.AGUARDANDO_APROVACAO)
    this.registrarEvento(new OrcamentoGerado(this.id, this.orcamento().centavos))
  }

  /** Aprovação do orçamento pelo cliente: AGUARDANDO_APROVACAO → EM_EXECUCAO. */
  aprovar(): void {
    if (this._status.valor !== StatusOS.AGUARDANDO_APROVACAO) {
      throw new RegraDeNegocioViolada(
        'A OS só pode ser aprovada quando estiver aguardando aprovação.'
      )
    }
    /* c8 ignore next 3 -- guarda defensiva: chegar a AGUARDANDO_APROVACAO exige orçamento (itens) */
    if (this._itens.length === 0) {
      throw new RegraDeNegocioViolada('Não é possível aprovar uma OS sem itens/orçamento.')
    }
    this.transitarPara(StatusOS.EM_EXECUCAO)
    this.registrarEvento(new OrdemServicoAprovada(this.id))
  }

  /** Recusa do orçamento pelo cliente: AGUARDANDO_APROVACAO → RECUSADA (terminal). */
  recusar(): void {
    if (this._status.valor !== StatusOS.AGUARDANDO_APROVACAO) {
      throw new RegraDeNegocioViolada(
        'A OS só pode ser recusada quando estiver aguardando aprovação.'
      )
    }
    this.transitarPara(StatusOS.RECUSADA)
    this.registrarEvento(new OrdemServicoRecusada(this.id))
  }

  /** Renegociação: AGUARDANDO_APROVACAO → EM_DIAGNOSTICO, reabrindo a edição. */
  renegociar(): void {
    if (this._status.valor !== StatusOS.AGUARDANDO_APROVACAO) {
      throw new RegraDeNegocioViolada(
        'A OS só pode ser renegociada quando estiver aguardando aprovação.'
      )
    }
    this.transitarPara(StatusOS.EM_DIAGNOSTICO)
  }

  /** Finaliza a execução: EM_EXECUCAO → FINALIZADA. */
  finalizar(): void {
    this.transitarPara(StatusOS.FINALIZADA)
    this.registrarEvento(new OrdemServicoFinalizada(this.id, this.duracaoExecucaoMinutos()))
  }

  /** Entrega do veículo ao cliente: FINALIZADA → ENTREGUE. */
  entregar(): void {
    this.transitarPara(StatusOS.ENTREGUE)
    this.registrarEvento(new VeiculoEntregue(this.id))
  }

  /**
   * Duração da execução em minutos (de EM_EXECUCAO até FINALIZADA), ou `null`
   * quando a OS ainda não foi finalizada.
   */
  duracaoExecucaoMinutos(): number | null {
    const inicio = this._historico.find((h) => h.status === StatusOS.EM_EXECUCAO)
    const fim = this._historico.find((h) => h.status === StatusOS.FINALIZADA)
    if (!inicio || !fim) {
      return null
    }
    return fim.ocorridoEm.diff(inicio.ocorridoEm, 'minutes').minutes
  }

  get clienteId(): string {
    return this._clienteId
  }

  get veiculoId(): string {
    return this._veiculoId
  }

  get status(): StatusOrdemServico {
    return this._status
  }

  get prioridade(): PrioridadeOS {
    return this._prioridade
  }

  get itens(): ReadonlyArray<ItemOrdemServico> {
    return this._itens
  }

  get historico(): ReadonlyArray<RegistroStatus> {
    return this._historico
  }

  get criadaEm(): DateTime {
    return this._criadaEm
  }
}
