import { opcoesDeCliente } from '#shared/frameworks-drivers/contexto-transacional'
import type { RepositorioDeUsuarios } from '../../use-cases/ports/repositorio-de-usuarios.js'
import type { Usuario } from '../../entities/usuario.js'
import { Email } from '../../entities/objetos-de-valor/email.js'
import UsuarioModel from '../../frameworks-drivers/models/usuario_model.js'
import { MapeadorDeUsuario } from './mapeador-de-usuario.js'

export class RepositorioDeUsuariosLucid implements RepositorioDeUsuarios {
  async salvar(usuario: Usuario): Promise<void> {
    const dados = MapeadorDeUsuario.paraPersistencia(usuario)
    await UsuarioModel.updateOrCreate({ id: dados.id }, dados, opcoesDeCliente())
  }

  async buscarPorEmail(email: Email): Promise<Usuario | null> {
    const model = await UsuarioModel.findBy('email', email.valor, opcoesDeCliente())
    return model ? MapeadorDeUsuario.paraDominio(model) : null
  }

  async existeComEmail(email: Email): Promise<boolean> {
    const model = await UsuarioModel.findBy('email', email.valor, opcoesDeCliente())
    return model !== null
  }
}
