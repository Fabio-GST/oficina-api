import { inject } from '@adonisjs/core'
import {
  apresentarOrdens,
  apresentarOrdem,
  apresentarAndamento,
  apresentarTempoMedio,
} from '../presenters/apresentador-de-ordem-servico.js'
import { CriarOrdemServico } from '../../use-cases/criar-ordem-servico.js'
import { AdicionarServicoNaOrdem, AdicionarPecaNaOrdem } from '../../use-cases/gerir-itens.js'
import {
  AlterarStatusDaOrdem,
  AprovarOrdemServico,
  IniciarDiagnostico,
  GerarOrcamento,
  RecusarOrdemServico,
  RenegociarOrdemServico,
  FinalizarOrdemServico,
  EntregarVeiculo,
} from '../../use-cases/gerir-status.js'
import { ProcessarDecisaoOrcamento } from '../../use-cases/processar-decisao-orcamento.js'
import {
  DetalharOrdem,
  ListarOrdens,
  ConsultarAndamento,
  CalcularTempoMedioExecucao,
} from '../../use-cases/consultas.js'
import type { HttpContext } from '@adonisjs/core/http'
import {
  criarOrdemServicoValidator,
  adicionarServicoValidator,
  adicionarPecaValidator,
  alterarStatusValidator,
  decisaoOrcamentoValidator,
} from '../../frameworks-drivers/validadores/ordem_servico_validadores.js'

@inject()
export default class OrdensServicoController {
  constructor(
    private criarOrdemServico: CriarOrdemServico,
    private adicionarServicoNaOrdem: AdicionarServicoNaOrdem,
    private adicionarPecaNaOrdem: AdicionarPecaNaOrdem,
    private alterarStatusDaOrdem: AlterarStatusDaOrdem,
    private aprovarOrdemServico: AprovarOrdemServico,
    private processarDecisaoOrcamento: ProcessarDecisaoOrcamento,
    private iniciarDiagnosticoUseCase: IniciarDiagnostico,
    private gerarOrcamentoUseCase: GerarOrcamento,
    private recusarOrdemServico: RecusarOrdemServico,
    private renegociarOrdemServico: RenegociarOrdemServico,
    private finalizarOrdemServico: FinalizarOrdemServico,
    private entregarVeiculo: EntregarVeiculo,
    private detalharOrdem: DetalharOrdem,
    private listarOrdens: ListarOrdens,
    private consultarAndamento: ConsultarAndamento,
    private calcularTempoMedioExecucao: CalcularTempoMedioExecucao
  ) {}
  /**
   * @index
   * @tag Ordens de Serviço
   * @summary Lista as Ordens de Serviço
   * @responseBody 200 - [{"id":"uuid","clienteId":"uuid","veiculoId":"uuid","status":"RECEBIDA","prioridade":"NORMAL","orcamento":210,"itens":[],"historico":[],"criadaEm":"2026-01-01T10:00:00.000Z"}] - Lista de OS
   */
  async index() {
    return apresentarOrdens(await this.listarOrdens.executar())
  }

  /**
   * @show
   * @tag Ordens de Serviço
   * @summary Detalha uma OS (itens, orçamento e histórico)
   * @paramPath id - Identificador (UUID) da OS - @type(string)
   * @responseBody 200 - {"id":"uuid","clienteId":"uuid","veiculoId":"uuid","status":"RECEBIDA","prioridade":"NORMAL","orcamento":210,"itens":[{"id":"uuid","tipo":"PECA","referenciaId":"uuid","descricao":"Óleo 5W30","precoUnitario":45,"quantidade":2,"subtotal":90}],"historico":[{"status":"RECEBIDA","ocorridoEm":"2026-01-01T10:00:00.000Z"}],"criadaEm":"2026-01-01T10:00:00.000Z"} - OS encontrada
   * @responseBody 404 - {"erro":{"codigo":"RECURSO_NAO_ENCONTRADO","mensagem":"Ordem de Serviço não encontrada."}} - OS inexistente
   */
  async show({ params }: HttpContext) {
    return apresentarOrdem(await this.detalharOrdem.executar(params.id))
  }

  /**
   * @store
   * @tag Ordens de Serviço
   * @summary Abre uma nova Ordem de Serviço
   * @description Compõe o orçamento com os serviços e peças informados. A inclusão de peças reserva o estoque de forma atômica; a baixa efetiva ocorre na aprovação.
   * @requestBody {"clienteId":"uuid","veiculoId":"uuid","prioridade":"NORMAL","servicos":[{"servicoId":"uuid","quantidade":1}],"pecas":[{"pecaId":"uuid","quantidade":2}]}
   * @responseBody 201 - {"id":"uuid","clienteId":"uuid","veiculoId":"uuid","status":"RECEBIDA","prioridade":"NORMAL","orcamento":210,"itens":[],"historico":[],"criadaEm":"2026-01-01T10:00:00.000Z"} - OS aberta
   * @responseBody 404 - {"erro":{"codigo":"RECURSO_NAO_ENCONTRADO","mensagem":"Cliente, veículo, serviço ou peça não encontrado."}} - Recurso referenciado inexistente
   * @responseBody 422 - {"erro":{"codigo":"REGRA_DE_NEGOCIO_VIOLADA","mensagem":"O veículo informado não pertence ao cliente."}} - Regra de negócio violada
   */
  async store({ request, response }: HttpContext) {
    const dados = await request.validateUsing(criarOrdemServicoValidator)
    const ordem = await this.criarOrdemServico.executar(dados)
    return response.created(apresentarOrdem(ordem))
  }

  /**
   * @adicionarServico
   * @tag Ordens de Serviço
   * @summary Adiciona um serviço à OS, recompondo o orçamento
   * @paramPath id - Identificador (UUID) da OS - @type(string)
   * @requestBody {"servicoId":"uuid","quantidade":1}
   * @responseBody 200 - {"id":"uuid","status":"RECEBIDA","orcamento":120,"itens":[],"historico":[]} - Serviço adicionado
   * @responseBody 404 - {"erro":{"codigo":"RECURSO_NAO_ENCONTRADO","mensagem":"OS ou serviço não encontrado."}} - OS ou serviço inexistente
   * @responseBody 422 - {"erro":{"codigo":"REGRA_DE_NEGOCIO_VIOLADA","mensagem":"O serviço está inativo."}} - Serviço inativo
   */
  async adicionarServico({ params, request }: HttpContext) {
    const dados = await request.validateUsing(adicionarServicoValidator)
    return apresentarOrdem(
      await this.adicionarServicoNaOrdem.executar({ ordemId: params.id, ...dados })
    )
  }

  /**
   * @adicionarPeca
   * @tag Ordens de Serviço
   * @summary Adiciona uma peça à OS, reservando o estoque (atômico)
   * @description Inclui um **ItemOrdemServico** do tipo peça e **reserva** unidades do estoque. A **baixa efetiva** ocorre na aprovação da OS, via Política que reage ao evento `ordem-servico.aprovada`.
   * @paramPath id - Identificador (UUID) da OS - @type(string)
   * @requestBody {"pecaId":"uuid","quantidade":2}
   * @responseBody 200 - {"id":"uuid","status":"RECEBIDA","orcamento":90,"itens":[],"historico":[]} - Peça adicionada e estoque reservado
   * @responseBody 404 - {"erro":{"codigo":"RECURSO_NAO_ENCONTRADO","mensagem":"OS ou peça não encontrada."}} - OS ou peça inexistente
   * @responseBody 422 - {"erro":{"codigo":"REGRA_DE_NEGOCIO_VIOLADA","mensagem":"Estoque insuficiente para reservar."}} - Saldo insuficiente
   */
  async adicionarPeca({ params, request }: HttpContext) {
    const dados = await request.validateUsing(adicionarPecaValidator)
    return apresentarOrdem(
      await this.adicionarPecaNaOrdem.executar({ ordemId: params.id, ...dados })
    )
  }

  /**
   * @alterarStatus
   * @tag Ordens de Serviço
   * @summary Altera o status da OS (transição genérica)
   * @paramPath id - Identificador (UUID) da OS - @type(string)
   * @requestBody {"status":"EM_DIAGNOSTICO"}
   * @responseBody 200 - {"id":"uuid","status":"EM_DIAGNOSTICO","orcamento":0,"itens":[],"historico":[]} - Status alterado
   * @responseBody 404 - {"erro":{"codigo":"RECURSO_NAO_ENCONTRADO","mensagem":"Ordem de Serviço não encontrada."}} - OS inexistente
   * @responseBody 422 - {"erro":{"codigo":"REGRA_DE_NEGOCIO_VIOLADA","mensagem":"Transição de status inválida."}} - Transição não permitida
   */
  async alterarStatus({ params, request }: HttpContext) {
    const { status } = await request.validateUsing(alterarStatusValidator)
    return apresentarOrdem(
      await this.alterarStatusDaOrdem.executar({ ordemId: params.id, novoStatus: status })
    )
  }

  /**
   * @decisaoOrcamento
   * @tag Ordens de Serviço
   * @summary Recebe a decisão externa sobre o orçamento (webhook)
   * @description Endpoint para sistemas externos notificarem a aprovação ou recusa do orçamento pelo cliente. Protegido pelo header `x-webhook-token` (segredo compartilhado, configurado em `WEBHOOK_SECRET`). Idempotente: reenvios da mesma decisão retornam o estado atual sem erro.
   * @paramPath id - Identificador (UUID) da OS - @type(string)
   * @requestBody {"decisao":"APROVADO"}
   * @responseBody 200 - {"id":"uuid","status":"EM_EXECUCAO","orcamento":210,"itens":[],"historico":[]} - Decisão aplicada (ou já refletida)
   * @responseBody 401 - {"erro":{"codigo":"NAO_AUTENTICADO","mensagem":"Token de webhook ausente ou inválido."}} - Segredo do webhook inválido
   * @responseBody 404 - {"erro":{"codigo":"RECURSO_NAO_ENCONTRADO","mensagem":"Ordem de Serviço não encontrada."}} - OS inexistente
   * @responseBody 422 - {"erro":{"codigo":"REGRA_DE_NEGOCIO_VIOLADA","mensagem":"A OS não está aguardando aprovação."}} - Estado inválido para a decisão
   */
  async decisaoOrcamento({ params, request }: HttpContext) {
    const { decisao } = await request.validateUsing(decisaoOrcamentoValidator)
    return apresentarOrdem(
      await this.processarDecisaoOrcamento.executar({ ordemId: params.id, decisao })
    )
  }

  /**
   * @aprovar
   * @tag Ordens de Serviço
   * @summary Aprova o orçamento (AGUARDANDO_APROVACAO → EM_EXECUCAO)
   * @description Confirma o **Orçamento** da OS. Dispara o evento `ordem-servico.aprovada`, que aciona a Política de **utilização** das peças reservadas no estoque.
   * @paramPath id - Identificador (UUID) da OS - @type(string)
   * @responseBody 200 - {"id":"uuid","status":"EM_EXECUCAO","orcamento":210,"itens":[],"historico":[]} - Orçamento aprovado
   * @responseBody 422 - {"erro":{"codigo":"REGRA_DE_NEGOCIO_VIOLADA","mensagem":"A OS só pode ser aprovada quando estiver aguardando aprovação."}} - Estado inválido
   */
  async aprovar({ params }: HttpContext) {
    return apresentarOrdem(await this.aprovarOrdemServico.executar(params.id))
  }

  /**
   * @iniciarDiagnostico
   * @tag Ordens de Serviço
   * @summary Inicia o diagnóstico (RECEBIDA → EM_DIAGNOSTICO)
   * @paramPath id - Identificador (UUID) da OS - @type(string)
   * @responseBody 200 - {"id":"uuid","status":"EM_DIAGNOSTICO","orcamento":0,"itens":[],"historico":[]} - Diagnóstico iniciado
   * @responseBody 422 - {"erro":{"codigo":"REGRA_DE_NEGOCIO_VIOLADA","mensagem":"Transição de status inválida."}} - Estado inválido
   */
  async iniciarDiagnostico({ params }: HttpContext) {
    return apresentarOrdem(await this.iniciarDiagnosticoUseCase.executar(params.id))
  }

  /**
   * @gerarOrcamento
   * @tag Ordens de Serviço
   * @summary Gera o orçamento e envia para aprovação (EM_DIAGNOSTICO → AGUARDANDO_APROVACAO)
   * @paramPath id - Identificador (UUID) da OS - @type(string)
   * @responseBody 200 - {"id":"uuid","status":"AGUARDANDO_APROVACAO","orcamento":210,"itens":[],"historico":[]} - Orçamento gerado
   * @responseBody 422 - {"erro":{"codigo":"REGRA_DE_NEGOCIO_VIOLADA","mensagem":"Não é possível gerar orçamento de uma OS sem itens."}} - OS sem itens
   */
  async gerarOrcamento({ params }: HttpContext) {
    return apresentarOrdem(await this.gerarOrcamentoUseCase.executar(params.id))
  }

  /**
   * @recusar
   * @tag Ordens de Serviço
   * @summary Recusa o orçamento (AGUARDANDO_APROVACAO → RECUSADA)
   * @description Encerra a OS como **Recusada** (estado terminal). Dispara `ordem-servico.recusada`, que libera as reservas de peças no estoque.
   * @paramPath id - Identificador (UUID) da OS - @type(string)
   * @responseBody 200 - {"id":"uuid","status":"RECUSADA","orcamento":210,"itens":[],"historico":[]} - Orçamento recusado
   * @responseBody 422 - {"erro":{"codigo":"REGRA_DE_NEGOCIO_VIOLADA","mensagem":"A OS só pode ser recusada quando estiver aguardando aprovação."}} - Estado inválido
   */
  async recusar({ params }: HttpContext) {
    return apresentarOrdem(await this.recusarOrdemServico.executar(params.id))
  }

  /**
   * @renegociar
   * @tag Ordens de Serviço
   * @summary Renegocia o orçamento (AGUARDANDO_APROVACAO → EM_DIAGNOSTICO)
   * @paramPath id - Identificador (UUID) da OS - @type(string)
   * @responseBody 200 - {"id":"uuid","status":"EM_DIAGNOSTICO","orcamento":210,"itens":[],"historico":[]} - OS reaberta para edição
   * @responseBody 422 - {"erro":{"codigo":"REGRA_DE_NEGOCIO_VIOLADA","mensagem":"A OS só pode ser renegociada quando estiver aguardando aprovação."}} - Estado inválido
   */
  async renegociar({ params }: HttpContext) {
    return apresentarOrdem(await this.renegociarOrdemServico.executar(params.id))
  }

  /**
   * @finalizar
   * @tag Ordens de Serviço
   * @summary Finaliza a execução (EM_EXECUCAO → FINALIZADA)
   * @description Conclui a execução dos serviços. Dispara `ordem-servico.finalizada`, que aciona a Política de **geração da Cobrança** no contexto de Pagamento.
   * @paramPath id - Identificador (UUID) da OS - @type(string)
   * @responseBody 200 - {"id":"uuid","status":"FINALIZADA","orcamento":210,"itens":[],"historico":[]} - Execução finalizada
   * @responseBody 422 - {"erro":{"codigo":"REGRA_DE_NEGOCIO_VIOLADA","mensagem":"Transição de status inválida."}} - Estado inválido
   */
  async finalizar({ params }: HttpContext) {
    return apresentarOrdem(await this.finalizarOrdemServico.executar(params.id))
  }

  /**
   * @entregar
   * @tag Ordens de Serviço
   * @summary Entrega o veículo ao cliente (FINALIZADA → ENTREGUE)
   * @paramPath id - Identificador (UUID) da OS - @type(string)
   * @responseBody 200 - {"id":"uuid","status":"ENTREGUE","orcamento":210,"itens":[],"historico":[]} - Veículo entregue
   * @responseBody 422 - {"erro":{"codigo":"REGRA_DE_NEGOCIO_VIOLADA","mensagem":"Transição de status inválida."}} - Estado inválido
   */
  async entregar({ params }: HttpContext) {
    return apresentarOrdem(await this.entregarVeiculo.executar(params.id))
  }

  /**
   * @andamento
   * @tag Ordens de Serviço
   * @summary Acompanhamento público da OS (sem autenticação)
   * @paramPath id - Identificador (UUID) da OS - @type(string)
   * @responseBody 200 - {"id":"uuid","status":"EM_EXECUCAO","orcamento":210,"historico":[{"status":"RECEBIDA","ocorridoEm":"2026-01-01T10:00:00.000Z"}]} - Andamento da OS
   * @responseBody 404 - {"erro":{"codigo":"RECURSO_NAO_ENCONTRADO","mensagem":"Ordem de Serviço não encontrada."}} - OS inexistente
   */
  async andamento({ params }: HttpContext) {
    return apresentarAndamento(await this.consultarAndamento.executar(params.id))
  }

  /**
   * @tempoMedioExecucao
   * @tag Ordens de Serviço
   * @summary Tempo médio de execução das OS (EM_EXECUCAO → FINALIZADA)
   * @responseBody 200 - {"tempoMedioMinutos":42,"ordensConsideradas":7} - Métrica calculada
   */
  async tempoMedioExecucao() {
    return apresentarTempoMedio(await this.calcularTempoMedioExecucao.executar())
  }
}
