import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import { apresentarOrdem, apresentarOrdens } from '../presenters/apresentador-de-ordem-servico.js'
import {
  ListarMinhasOrdens,
  DetalharMinhaOrdem,
  AprovarMinhaOrdem,
  RecusarMinhaOrdem,
} from '../../use-cases/portal-do-cliente.js'

/**
 * Rotas do **cliente autenticado por CPF** (`/me/work-orders`). O id do
 * cliente vem da claim `sub` do JWT emitido pela Function Serverless; nunca
 * da URL ou do corpo.
 */
@inject()
export default class PortalClienteController {
  constructor(
    private listarMinhasOrdens: ListarMinhasOrdens,
    private detalharMinhaOrdem: DetalharMinhaOrdem,
    private aprovarMinhaOrdem: AprovarMinhaOrdem,
    private recusarMinhaOrdem: RecusarMinhaOrdem
  ) {}

  /**
   * @minhasOrdens
   * @tag Portal do Cliente
   * @summary Lista as Ordens de Serviço do cliente autenticado por CPF
   * @description Requer JWT de **cliente** (`papel: cliente`), emitido pela Function Serverless em `POST /auth/cpf`. Devolve todas as OS do cliente, inclusive finalizadas e entregues, mais recentes primeiro.
   * @responseBody 200 - [{"id":"uuid","clienteId":"uuid","veiculoId":"uuid","status":"EM_EXECUCAO","prioridade":"NORMAL","orcamento":210,"itens":[],"historico":[],"criadaEm":"2026-01-01T10:00:00.000Z"}] - Ordens do cliente
   * @responseBody 403 - {"erro":{"codigo":"ACESSO_NEGADO","mensagem":"Acesso restrito ao(s) papel(is): cliente."}} - Token de administrador
   */
  async minhasOrdens({ usuarioAutenticado }: HttpContext) {
    return apresentarOrdens(await this.listarMinhasOrdens.executar(usuarioAutenticado!.sub))
  }

  /**
   * @minhaOrdem
   * @tag Portal do Cliente
   * @summary Detalha uma OS do cliente autenticado (itens, orçamento e histórico)
   * @paramPath id - Identificador (UUID) da OS - @type(string)
   * @responseBody 200 - {"id":"uuid","clienteId":"uuid","veiculoId":"uuid","status":"AGUARDANDO_APROVACAO","prioridade":"NORMAL","orcamento":210,"itens":[{"id":"uuid","tipo":"PECA","referenciaId":"uuid","descricao":"Óleo 5W30","precoUnitario":45,"quantidade":2,"subtotal":90}],"historico":[{"status":"RECEBIDA","ocorridoEm":"2026-01-01T10:00:00.000Z"}],"criadaEm":"2026-01-01T10:00:00.000Z"} - OS do cliente
   * @responseBody 404 - {"erro":{"codigo":"RECURSO_NAO_ENCONTRADO","mensagem":"Ordem de Serviço não encontrada."}} - OS inexistente ou de outro cliente
   */
  async minhaOrdem({ params, usuarioAutenticado }: HttpContext) {
    return apresentarOrdem(
      await this.detalharMinhaOrdem.executar({
        clienteId: usuarioAutenticado!.sub,
        ordemId: params.id,
      })
    )
  }

  /**
   * @aprovar
   * @tag Portal do Cliente
   * @summary O cliente aprova o orçamento da própria OS (AGUARDANDO_APROVACAO → EM_EXECUCAO)
   * @description Dispara `ordem-servico.aprovada`, que utiliza as peças reservadas no estoque e notifica o cliente.
   * @paramPath id - Identificador (UUID) da OS - @type(string)
   * @responseBody 200 - {"id":"uuid","status":"EM_EXECUCAO","orcamento":210,"itens":[],"historico":[]} - Orçamento aprovado
   * @responseBody 404 - {"erro":{"codigo":"RECURSO_NAO_ENCONTRADO","mensagem":"Ordem de Serviço não encontrada."}} - OS inexistente ou de outro cliente
   * @responseBody 422 - {"erro":{"codigo":"REGRA_DE_NEGOCIO_VIOLADA","mensagem":"A OS só pode ser aprovada quando estiver aguardando aprovação."}} - Estado inválido
   */
  async aprovar({ params, usuarioAutenticado }: HttpContext) {
    return apresentarOrdem(
      await this.aprovarMinhaOrdem.executar({
        clienteId: usuarioAutenticado!.sub,
        ordemId: params.id,
      })
    )
  }

  /**
   * @recusar
   * @tag Portal do Cliente
   * @summary O cliente recusa o orçamento da própria OS (AGUARDANDO_APROVACAO → RECUSADA)
   * @description Dispara `ordem-servico.recusada`, que libera as reservas de peças no estoque.
   * @paramPath id - Identificador (UUID) da OS - @type(string)
   * @responseBody 200 - {"id":"uuid","status":"RECUSADA","orcamento":210,"itens":[],"historico":[]} - Orçamento recusado
   * @responseBody 404 - {"erro":{"codigo":"RECURSO_NAO_ENCONTRADO","mensagem":"Ordem de Serviço não encontrada."}} - OS inexistente ou de outro cliente
   * @responseBody 422 - {"erro":{"codigo":"REGRA_DE_NEGOCIO_VIOLADA","mensagem":"A OS só pode ser recusada quando estiver aguardando aprovação."}} - Estado inválido
   */
  async recusar({ params, usuarioAutenticado }: HttpContext) {
    return apresentarOrdem(
      await this.recusarMinhaOrdem.executar({
        clienteId: usuarioAutenticado!.sub,
        ordemId: params.id,
      })
    )
  }
}
