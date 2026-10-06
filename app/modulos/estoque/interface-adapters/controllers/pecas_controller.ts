import { inject } from '@adonisjs/core'
import {
  apresentarPecas,
  apresentarPeca,
  apresentarSolicitacaoDeCompra,
} from '../presenters/apresentador-de-estoque.js'
import { CriarPeca } from '../../use-cases/criar-peca.js'
import { AtualizarPeca } from '../../use-cases/atualizar-peca.js'
import { AjustarEstoque } from '../../use-cases/ajustar-estoque.js'
import { ReservarPeca } from '../../use-cases/reservar-peca.js'
import { UtilizarPeca } from '../../use-cases/utilizar-peca.js'
import { DefinirEstoqueMinimo } from '../../use-cases/definir-estoque-minimo.js'
import { SolicitarCompra } from '../../use-cases/solicitar-compra.js'
import { ReceberCompra } from '../../use-cases/receber-compra.js'
import { ObterPeca } from '../../use-cases/obter-peca.js'
import { ListarPecas } from '../../use-cases/listar-pecas.js'
import { RemoverPeca } from '../../use-cases/remover-peca.js'
import type { HttpContext } from '@adonisjs/core/http'
import {
  criarPecaValidator,
  atualizarPecaValidator,
  ajustarEstoqueValidator,
  movimentarEstoqueValidator,
  definirEstoqueMinimoValidator,
  solicitarCompraValidator,
} from '../../frameworks-drivers/validadores/peca_validadores.js'

@inject()
export default class PecasController {
  constructor(
    private criarPeca: CriarPeca,
    private atualizarPeca: AtualizarPeca,
    private ajustarEstoqueUseCase: AjustarEstoque,
    private reservarPeca: ReservarPeca,
    private utilizarPeca: UtilizarPeca,
    private definirEstoqueMinimoUseCase: DefinirEstoqueMinimo,
    private solicitarCompraUseCase: SolicitarCompra,
    private receberCompraUseCase: ReceberCompra,
    private obterPeca: ObterPeca,
    private listarPecas: ListarPecas,
    private removerPeca: RemoverPeca
  ) {}
  /**
   * @index
   * @tag Estoque
   * @summary Lista as peças em estoque
   * @responseBody 200 - [{"id":"uuid","nome":"Óleo 5W30","descricao":"Sintético","preco":45,"quantidadeEstoque":10,"quantidadeReservada":0,"estoqueMinimo":2}] - Lista de peças
   */
  async index() {
    return apresentarPecas(await this.listarPecas.executar())
  }

  /**
   * @show
   * @tag Estoque
   * @summary Detalha uma peça pelo identificador
   * @paramPath id - Identificador (UUID) da peça - @type(string)
   * @responseBody 200 - {"id":"uuid","nome":"Óleo 5W30","descricao":"Sintético","preco":45,"quantidadeEstoque":10,"quantidadeReservada":0,"estoqueMinimo":2} - Peça encontrada
   * @responseBody 404 - {"erro":{"codigo":"RECURSO_NAO_ENCONTRADO","mensagem":"Peça não encontrada."}} - Peça inexistente
   */
  async show({ params }: HttpContext) {
    return apresentarPeca(await this.obterPeca.executar(params.id))
  }

  /**
   * @store
   * @tag Estoque
   * @summary Cadastra uma nova peça
   * @requestBody {"nome":"Óleo 5W30","descricao":"Sintético","preco":45,"quantidadeEstoque":10,"estoqueMinimo":2}
   * @responseBody 201 - {"id":"uuid","nome":"Óleo 5W30","descricao":"Sintético","preco":45,"quantidadeEstoque":10,"quantidadeReservada":0,"estoqueMinimo":2} - Peça cadastrada
   * @responseBody 422 - {"errors":[{"message":"O campo nome é obrigatório"}]} - Dados inválidos
   */
  async store({ request, response }: HttpContext) {
    const dados = await request.validateUsing(criarPecaValidator)
    const peca = await this.criarPeca.executar(dados)
    return response.created(apresentarPeca(peca))
  }

  /**
   * @update
   * @tag Estoque
   * @summary Atualiza nome, descrição e preço da peça
   * @paramPath id - Identificador (UUID) da peça - @type(string)
   * @requestBody {"nome":"Óleo 5W30","descricao":"Sintético premium","preco":50}
   * @responseBody 200 - {"id":"uuid","nome":"Óleo 5W30","descricao":"Sintético premium","preco":50,"quantidadeEstoque":10,"quantidadeReservada":0,"estoqueMinimo":2} - Peça atualizada
   * @responseBody 404 - {"erro":{"codigo":"RECURSO_NAO_ENCONTRADO","mensagem":"Peça não encontrada."}} - Peça inexistente
   */
  async update({ params, request }: HttpContext) {
    const dados = await request.validateUsing(atualizarPecaValidator)
    return apresentarPeca(await this.atualizarPeca.executar({ id: params.id, ...dados }))
  }

  /**
   * @ajustarEstoque
   * @tag Estoque
   * @summary Ajusta a quantidade disponível em estoque (valor absoluto)
   * @paramPath id - Identificador (UUID) da peça - @type(string)
   * @requestBody {"quantidade":20}
   * @responseBody 200 - {"id":"uuid","nome":"Óleo 5W30","preco":45,"quantidadeEstoque":20,"quantidadeReservada":0,"estoqueMinimo":2} - Estoque ajustado
   * @responseBody 404 - {"erro":{"codigo":"RECURSO_NAO_ENCONTRADO","mensagem":"Peça não encontrada."}} - Peça inexistente
   */
  async ajustarEstoque({ params, request }: HttpContext) {
    const { quantidade } = await request.validateUsing(ajustarEstoqueValidator)
    return apresentarPeca(await this.ajustarEstoqueUseCase.executar({ id: params.id, quantidade }))
  }

  /**
   * @reservar
   * @tag Estoque
   * @summary Reserva unidades da peça (bloqueia para uma OS)
   * @description Bloqueia **QuantidadeEstoque** para uma OS sem baixar o saldo. A reserva também ocorre automaticamente ao adicionar peça na OS; este endpoint expõe a operação diretamente no contexto de Estoque.
   * @paramPath id - Identificador (UUID) da peça - @type(string)
   * @requestBody {"quantidade":5}
   * @responseBody 200 - {"id":"uuid","nome":"Óleo 5W30","preco":45,"quantidadeEstoque":5,"quantidadeReservada":5,"estoqueMinimo":2} - Reserva efetuada
   * @responseBody 404 - {"erro":{"codigo":"RECURSO_NAO_ENCONTRADO","mensagem":"Peça não encontrada."}} - Peça inexistente
   * @responseBody 422 - {"erro":{"codigo":"REGRA_DE_NEGOCIO_VIOLADA","mensagem":"Estoque insuficiente para reservar."}} - Saldo insuficiente
   */
  async reservar({ params, request }: HttpContext) {
    const { quantidade } = await request.validateUsing(movimentarEstoqueValidator)
    return apresentarPeca(await this.reservarPeca.executar({ id: params.id, quantidade }))
  }

  /**
   * @utilizar
   * @tag Estoque
   * @summary Consome unidades reservadas (baixa efetiva)
   * @description Efetua a **baixa** das unidades previamente reservadas. Na OS, isso é acionado pela Política após aprovação (`ordem-servico.aprovada`); este endpoint expõe a operação diretamente.
   * @paramPath id - Identificador (UUID) da peça - @type(string)
   * @requestBody {"quantidade":5}
   * @responseBody 200 - {"id":"uuid","nome":"Óleo 5W30","preco":45,"quantidadeEstoque":5,"quantidadeReservada":0,"estoqueMinimo":2} - Baixa efetuada
   * @responseBody 404 - {"erro":{"codigo":"RECURSO_NAO_ENCONTRADO","mensagem":"Peça não encontrada."}} - Peça inexistente
   * @responseBody 422 - {"erro":{"codigo":"REGRA_DE_NEGOCIO_VIOLADA","mensagem":"Sem reserva suficiente para utilizar."}} - Reserva insuficiente
   */
  async utilizar({ params, request }: HttpContext) {
    const { quantidade } = await request.validateUsing(movimentarEstoqueValidator)
    return apresentarPeca(await this.utilizarPeca.executar({ id: params.id, quantidade }))
  }

  /**
   * @definirEstoqueMinimo
   * @tag Estoque
   * @summary Define o estoque mínimo (limiar de alerta)
   * @paramPath id - Identificador (UUID) da peça - @type(string)
   * @requestBody {"estoqueMinimo":3}
   * @responseBody 200 - {"id":"uuid","nome":"Óleo 5W30","preco":45,"quantidadeEstoque":10,"quantidadeReservada":0,"estoqueMinimo":3} - Estoque mínimo definido
   * @responseBody 404 - {"erro":{"codigo":"RECURSO_NAO_ENCONTRADO","mensagem":"Peça não encontrada."}} - Peça inexistente
   */
  async definirEstoqueMinimo({ params, request }: HttpContext) {
    const { estoqueMinimo } = await request.validateUsing(definirEstoqueMinimoValidator)
    return apresentarPeca(
      await this.definirEstoqueMinimoUseCase.executar({ id: params.id, estoqueMinimo })
    )
  }

  /**
   * @solicitarCompra
   * @tag Estoque
   * @summary Abre uma solicitação de compra de peça
   * @description Cria uma **SolicitacaoDeCompra** quando o saldo está abaixo do estoque mínimo. Normalmente acionada pela Política ao evento `estoque.abaixo-do-minimo`.
   * @paramPath id - Identificador (UUID) da peça - @type(string)
   * @requestBody {"quantidade":10}
   * @responseBody 201 - {"id":"uuid","pecaId":"uuid","quantidade":10,"status":"SOLICITADA","criadaEm":"2026-01-01T10:00:00.000Z"} - Solicitação aberta
   * @responseBody 404 - {"erro":{"codigo":"RECURSO_NAO_ENCONTRADO","mensagem":"Peça não encontrada."}} - Peça inexistente
   */
  async solicitarCompra({ params, request, response }: HttpContext) {
    const { quantidade } = await request.validateUsing(solicitarCompraValidator)
    const solicitacao = await this.solicitarCompraUseCase.executar({
      pecaId: params.id,
      quantidade,
    })
    return response.created(apresentarSolicitacaoDeCompra(solicitacao))
  }

  /**
   * @receberCompra
   * @tag Estoque
   * @summary Recebe uma compra e repõe o estoque (atômico)
   * @paramPath id - Identificador (UUID) da solicitação de compra - @type(string)
   * @responseBody 200 - {"id":"uuid","pecaId":"uuid","quantidade":10,"status":"RECEBIDA","criadaEm":"2026-01-01T10:00:00.000Z","recebidaEm":"2026-01-02T09:00:00.000Z"} - Compra recebida
   * @responseBody 404 - {"erro":{"codigo":"RECURSO_NAO_ENCONTRADO","mensagem":"Solicitação de compra não encontrada."}} - Solicitação inexistente
   */
  async receberCompra({ params }: HttpContext) {
    return apresentarSolicitacaoDeCompra(await this.receberCompraUseCase.executar(params.id))
  }

  /**
   * @destroy
   * @tag Estoque
   * @summary Remove uma peça
   * @paramPath id - Identificador (UUID) da peça - @type(string)
   * @responseBody 204 - Peça removida
   * @responseBody 404 - {"erro":{"codigo":"RECURSO_NAO_ENCONTRADO","mensagem":"Peça não encontrada."}} - Peça inexistente
   */
  async destroy({ params, response }: HttpContext) {
    await this.removerPeca.executar(params.id)
    return response.noContent()
  }
}
