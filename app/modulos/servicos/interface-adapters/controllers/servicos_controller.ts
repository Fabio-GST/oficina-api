import { inject } from '@adonisjs/core'
import { apresentarServicos, apresentarServico } from '../presenters/apresentador-de-servico.js'
import { CriarServico } from '../../use-cases/criar-servico.js'
import { AtualizarServico } from '../../use-cases/atualizar-servico.js'
import { InativarServico } from '../../use-cases/inativar-servico.js'
import { ReativarServico } from '../../use-cases/reativar-servico.js'
import { DefinirTempoEstimado } from '../../use-cases/definir-tempo-estimado.js'
import { ObterServico } from '../../use-cases/obter-servico.js'
import { ListarServicos } from '../../use-cases/listar-servicos.js'
import { RemoverServico } from '../../use-cases/remover-servico.js'
import type { HttpContext } from '@adonisjs/core/http'
import {
  criarServicoValidator,
  atualizarServicoValidator,
  definirTempoEstimadoValidator,
} from '../../frameworks-drivers/validadores/servico_validadores.js'

@inject()
export default class ServicosController {
  constructor(
    private criarServico: CriarServico,
    private atualizarServico: AtualizarServico,
    private inativarServico: InativarServico,
    private reativarServico: ReativarServico,
    private definirTempoEstimadoUseCase: DefinirTempoEstimado,
    private obterServico: ObterServico,
    private listarServicos: ListarServicos,
    private removerServico: RemoverServico
  ) {}
  /**
   * @index
   * @tag Serviços
   * @summary Lista os serviços oferecidos pela oficina
   * @responseBody 200 - [{"id":"uuid","nome":"Troca de óleo","descricao":"Inclui filtro","preco":120,"ativo":true,"tempoEstimadoMinutos":30}] - Lista de serviços
   */
  async index() {
    return apresentarServicos(await this.listarServicos.executar())
  }

  /**
   * @show
   * @tag Serviços
   * @summary Detalha um serviço pelo identificador
   * @paramPath id - Identificador (UUID) do serviço - @type(string)
   * @responseBody 200 - {"id":"uuid","nome":"Troca de óleo","descricao":"Inclui filtro","preco":120,"ativo":true,"tempoEstimadoMinutos":30} - Serviço encontrado
   * @responseBody 404 - {"erro":{"codigo":"RECURSO_NAO_ENCONTRADO","mensagem":"Serviço não encontrado."}} - Serviço inexistente
   */
  async show({ params }: HttpContext) {
    return apresentarServico(await this.obterServico.executar(params.id))
  }

  /**
   * @store
   * @tag Serviços
   * @summary Cadastra um novo serviço
   * @requestBody {"nome":"Troca de óleo","descricao":"Inclui filtro","preco":120,"tempoEstimadoMinutos":30}
   * @responseBody 201 - {"id":"uuid","nome":"Troca de óleo","descricao":"Inclui filtro","preco":120,"ativo":true,"tempoEstimadoMinutos":30} - Serviço cadastrado
   * @responseBody 422 - {"errors":[{"message":"O campo nome é obrigatório"}]} - Dados inválidos
   */
  async store({ request, response }: HttpContext) {
    const dados = await request.validateUsing(criarServicoValidator)
    const servico = await this.criarServico.executar(dados)
    return response.created(apresentarServico(servico))
  }

  /**
   * @update
   * @tag Serviços
   * @summary Atualiza nome, descrição e preço do serviço
   * @paramPath id - Identificador (UUID) do serviço - @type(string)
   * @requestBody {"nome":"Troca de óleo sintético","descricao":"5W30","preco":150}
   * @responseBody 200 - {"id":"uuid","nome":"Troca de óleo sintético","descricao":"5W30","preco":150,"ativo":true,"tempoEstimadoMinutos":30} - Serviço atualizado
   * @responseBody 404 - {"erro":{"codigo":"RECURSO_NAO_ENCONTRADO","mensagem":"Serviço não encontrado."}} - Serviço inexistente
   * @responseBody 422 - {"erro":{"codigo":"REGRA_DE_NEGOCIO_VIOLADA","mensagem":"Serviço inativo não pode ser alterado."}} - Serviço inativo
   */
  async update({ params, request }: HttpContext) {
    const dados = await request.validateUsing(atualizarServicoValidator)
    return apresentarServico(await this.atualizarServico.executar({ id: params.id, ...dados }))
  }

  /**
   * @inativar
   * @tag Serviços
   * @summary Inativa o serviço (bloqueia inclusão em novas OS)
   * @paramPath id - Identificador (UUID) do serviço - @type(string)
   * @responseBody 200 - {"id":"uuid","nome":"Troca de óleo","descricao":"Inclui filtro","preco":120,"ativo":false,"tempoEstimadoMinutos":30} - Serviço inativado
   * @responseBody 404 - {"erro":{"codigo":"RECURSO_NAO_ENCONTRADO","mensagem":"Serviço não encontrado."}} - Serviço inexistente
   */
  async inativar({ params }: HttpContext) {
    return apresentarServico(await this.inativarServico.executar(params.id))
  }

  /**
   * @reativar
   * @tag Serviços
   * @summary Reativa um serviço previamente inativado
   * @paramPath id - Identificador (UUID) do serviço - @type(string)
   * @responseBody 200 - {"id":"uuid","nome":"Troca de óleo","descricao":"Inclui filtro","preco":120,"ativo":true,"tempoEstimadoMinutos":30} - Serviço reativado
   * @responseBody 404 - {"erro":{"codigo":"RECURSO_NAO_ENCONTRADO","mensagem":"Serviço não encontrado."}} - Serviço inexistente
   */
  async reativar({ params }: HttpContext) {
    return apresentarServico(await this.reativarServico.executar(params.id))
  }

  /**
   * @definirTempoEstimado
   * @tag Serviços
   * @summary Define o tempo estimado de execução (em minutos)
   * @paramPath id - Identificador (UUID) do serviço - @type(string)
   * @requestBody {"tempoEstimadoMinutos":45}
   * @responseBody 200 - {"id":"uuid","nome":"Troca de óleo","descricao":"Inclui filtro","preco":120,"ativo":true,"tempoEstimadoMinutos":45} - Tempo estimado definido
   * @responseBody 404 - {"erro":{"codigo":"RECURSO_NAO_ENCONTRADO","mensagem":"Serviço não encontrado."}} - Serviço inexistente
   */
  async definirTempoEstimado({ params, request }: HttpContext) {
    const dados = await request.validateUsing(definirTempoEstimadoValidator)
    return apresentarServico(
      await this.definirTempoEstimadoUseCase.executar({ id: params.id, ...dados })
    )
  }

  /**
   * @destroy
   * @tag Serviços
   * @summary Remove um serviço
   * @paramPath id - Identificador (UUID) do serviço - @type(string)
   * @responseBody 204 - Serviço removido
   * @responseBody 404 - {"erro":{"codigo":"RECURSO_NAO_ENCONTRADO","mensagem":"Serviço não encontrado."}} - Serviço inexistente
   */
  async destroy({ params, response }: HttpContext) {
    await this.removerServico.executar(params.id)
    return response.noContent()
  }
}
