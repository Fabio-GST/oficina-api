import { inject } from '@adonisjs/core'
import { apresentarVeiculos, apresentarVeiculo } from '../presenters/apresentador-de-veiculo.js'
import { CriarVeiculo } from '../../use-cases/criar-veiculo.js'
import { AtualizarVeiculo } from '../../use-cases/atualizar-veiculo.js'
import { VincularClienteAoVeiculo } from '../../use-cases/vincular-cliente-ao-veiculo.js'
import { BuscarVeiculoPorPlaca } from '../../use-cases/buscar-veiculo-por-placa.js'
import { ObterVeiculo } from '../../use-cases/obter-veiculo.js'
import { ListarVeiculos } from '../../use-cases/listar-veiculos.js'
import { RemoverVeiculo } from '../../use-cases/remover-veiculo.js'
import type { HttpContext } from '@adonisjs/core/http'
import {
  criarVeiculoValidator,
  atualizarVeiculoValidator,
  vincularClienteValidator,
} from '../../frameworks-drivers/validadores/veiculo_validadores.js'

@inject()
export default class VeiculosController {
  constructor(
    private criarVeiculo: CriarVeiculo,
    private atualizarVeiculo: AtualizarVeiculo,
    private vincularClienteAoVeiculo: VincularClienteAoVeiculo,
    private buscarVeiculoPorPlaca: BuscarVeiculoPorPlaca,
    private obterVeiculo: ObterVeiculo,
    private listarVeiculos: ListarVeiculos,
    private removerVeiculo: RemoverVeiculo
  ) {}
  /**
   * @index
   * @tag Veículos
   * @summary Lista os veículos (opcionalmente filtrando por cliente)
   * @paramQuery clienteId - Filtra os veículos de um cliente específico (UUID) - @type(string)
   * @responseBody 200 - [{"id":"uuid","clienteId":"uuid","placa":"ABC1D23","marca":"Fiat","modelo":"Uno","ano":2020}] - Lista de veículos
   */
  async index({ request }: HttpContext) {
    const clienteId = request.qs().clienteId as string | undefined
    return apresentarVeiculos(await this.listarVeiculos.executar({ clienteId }))
  }

  /**
   * @show
   * @tag Veículos
   * @summary Detalha um veículo pelo identificador
   * @paramPath id - Identificador (UUID) do veículo - @type(string)
   * @responseBody 200 - {"id":"uuid","clienteId":"uuid","placa":"ABC1D23","marca":"Fiat","modelo":"Uno","ano":2020} - Veículo encontrado
   * @responseBody 404 - {"erro":{"codigo":"RECURSO_NAO_ENCONTRADO","mensagem":"Veículo não encontrado."}} - Veículo inexistente
   */
  async show({ params }: HttpContext) {
    return apresentarVeiculo(await this.obterVeiculo.executar(params.id))
  }

  /**
   * @porPlaca
   * @tag Veículos
   * @summary Busca um veículo pela placa
   * @paramPath placa - Placa no formato antigo (AAA9999) ou Mercosul (AAA9A99) - @type(string)
   * @responseBody 200 - {"id":"uuid","clienteId":"uuid","placa":"ABC1D23","marca":"Fiat","modelo":"Uno","ano":2020} - Veículo encontrado
   * @responseBody 404 - {"mensagem":"Veículo não encontrado para a placa informada."} - Placa não cadastrada
   */
  async porPlaca({ params, response }: HttpContext) {
    const veiculo = await this.buscarVeiculoPorPlaca.executar(params.placa)
    if (!veiculo) {
      return response.notFound({ mensagem: 'Veículo não encontrado para a placa informada.' })
    }
    return apresentarVeiculo(veiculo)
  }

  /**
   * @vincularCliente
   * @tag Veículos
   * @summary Vincula (ou transfere) o veículo a um cliente
   * @paramPath id - Identificador (UUID) do veículo - @type(string)
   * @requestBody {"clienteId":"uuid"}
   * @responseBody 200 - {"id":"uuid","clienteId":"uuid","placa":"ABC1D23","marca":"Fiat","modelo":"Uno","ano":2020} - Veículo vinculado ao novo cliente
   * @responseBody 404 - {"erro":{"codigo":"RECURSO_NAO_ENCONTRADO","mensagem":"Veículo ou cliente não encontrado."}} - Veículo ou cliente inexistente
   */
  async vincularCliente({ params, request }: HttpContext) {
    const dados = await request.validateUsing(vincularClienteValidator)
    return apresentarVeiculo(
      await this.vincularClienteAoVeiculo.executar({ id: params.id, ...dados })
    )
  }

  /**
   * @store
   * @tag Veículos
   * @summary Cadastra um novo veículo para um cliente
   * @requestBody {"clienteId":"uuid","placa":"ABC1D23","marca":"Fiat","modelo":"Uno","ano":2020}
   * @responseBody 201 - {"id":"uuid","clienteId":"uuid","placa":"ABC1D23","marca":"Fiat","modelo":"Uno","ano":2020} - Veículo cadastrado
   * @responseBody 404 - {"erro":{"codigo":"RECURSO_NAO_ENCONTRADO","mensagem":"Cliente não encontrado."}} - Cliente do veículo inexistente
   * @responseBody 409 - {"erro":{"codigo":"CONFLITO_DE_RECURSO","mensagem":"Já existe um veículo com a placa informada."}} - Placa já cadastrada
   * @responseBody 422 - {"errors":[{"message":"O campo placa é obrigatório"}]} - Dados inválidos
   */
  async store({ request, response }: HttpContext) {
    const dados = await request.validateUsing(criarVeiculoValidator)
    const veiculo = await this.criarVeiculo.executar(dados)
    return response.created(apresentarVeiculo(veiculo))
  }

  /**
   * @update
   * @tag Veículos
   * @summary Atualiza marca, modelo e ano do veículo
   * @paramPath id - Identificador (UUID) do veículo - @type(string)
   * @requestBody {"marca":"Fiat","modelo":"Uno Way","ano":2021}
   * @responseBody 200 - {"id":"uuid","clienteId":"uuid","placa":"ABC1D23","marca":"Fiat","modelo":"Uno Way","ano":2021} - Veículo atualizado
   * @responseBody 404 - {"erro":{"codigo":"RECURSO_NAO_ENCONTRADO","mensagem":"Veículo não encontrado."}} - Veículo inexistente
   */
  async update({ params, request }: HttpContext) {
    const dados = await request.validateUsing(atualizarVeiculoValidator)
    return apresentarVeiculo(await this.atualizarVeiculo.executar({ id: params.id, ...dados }))
  }

  /**
   * @destroy
   * @tag Veículos
   * @summary Remove um veículo
   * @paramPath id - Identificador (UUID) do veículo - @type(string)
   * @responseBody 204 - Veículo removido
   * @responseBody 404 - {"erro":{"codigo":"RECURSO_NAO_ENCONTRADO","mensagem":"Veículo não encontrado."}} - Veículo inexistente
   */
  async destroy({ params, response }: HttpContext) {
    await this.removerVeiculo.executar(params.id)
    return response.noContent()
  }
}
