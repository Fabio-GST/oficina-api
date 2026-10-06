import { inject } from '@adonisjs/core'
import {
  apresentarSessao,
  apresentarAdministrador,
} from '../presenters/apresentador-de-autenticacao.js'
import { RegistrarAdministrador } from '../../use-cases/registrar-administrador.js'
import { Autenticar } from '../../use-cases/autenticar.js'
import type { HttpContext } from '@adonisjs/core/http'
import {
  registrarAdministradorValidator,
  autenticarValidator,
} from '../../frameworks-drivers/validadores/autenticacao_validadores.js'

@inject()
export default class AutenticacaoController {
  constructor(
    private registrarAdministrador: RegistrarAdministrador,
    private autenticar: Autenticar
  ) {}
  /**
   * @register
   * @tag Autenticação
   * @summary Cadastra um novo Usuário administrativo
   * @description Cria um **Usuario** operador do sistema. Apenas administradores autenticados podem registrar novos usuários.
   * @requestBody {"nome":"João","email":"joao@oficina.com","senha":"senhaSegura1"}
   * @responseBody 201 - {"id":"uuid","nome":"João","email":"joao@oficina.com"} - Usuário cadastrado
   * @responseBody 422 - {"errors":[{"message":"O campo email é obrigatório"}]} - Dados inválidos
   */
  async register({ request, response }: HttpContext) {
    const dados = await request.validateUsing(registrarAdministradorValidator)
    const saida = await this.registrarAdministrador.executar(dados)
    return response.created(apresentarAdministrador(saida))
  }

  /**
   * @login
   * @tag Autenticação
   * @summary Autentica um Administrador e retorna um JWT
   * @description Valida e-mail e senha do **Usuario** e emite token Bearer para as APIs administrativas.
   * @requestBody {"email":"joao@oficina.com","senha":"senhaSegura1"}
   * @responseBody 200 - {"token":"eyJhbG...","usuario":{"id":"uuid","nome":"João","email":"joao@oficina.com"}} - Autenticação bem-sucedida
   * @responseBody 401 - {"erro":{"codigo":"NAO_AUTENTICADO","mensagem":"Credenciais inválidas."}} - Credenciais inválidas
   * @responseBody 422 - {"errors":[{"message":"O campo senha é obrigatório"}]} - Dados inválidos
   */
  async login({ request }: HttpContext) {
    const dados = await request.validateUsing(autenticarValidator)
    return apresentarSessao(await this.autenticar.executar(dados))
  }

  /**
   * @me
   * @tag Autenticação
   * @summary Retorna o Usuário autenticado
   * @description Consulta os dados do **Usuario** vinculado ao JWT informado no header Authorization.
   * @responseBody 200 - {"id":"uuid","nome":"João","email":"joao@oficina.com"} - Usuário autenticado
   * @responseBody 401 - {"erro":{"codigo":"NAO_AUTENTICADO","mensagem":"Token inválido ou expirado."}} - Token inválido
   */
  async me({ usuarioAutenticado }: HttpContext) {
    return {
      id: usuarioAutenticado!.sub,
      nome: usuarioAutenticado!.nome,
      email: usuarioAutenticado!.email,
    }
  }
}
