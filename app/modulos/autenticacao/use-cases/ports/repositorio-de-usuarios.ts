import { Usuario } from '../../entities/usuario.js'
import { Email } from '../../entities/objetos-de-valor/email.js'

/**
 * Contrato de persistência para usuários administrativos. A implementação
 * concreta (Lucid) vive na infraestrutura.
 */
export interface RepositorioDeUsuarios {
  salvar(usuario: Usuario): Promise<void>
  buscarPorEmail(email: Email): Promise<Usuario | null>
  existeComEmail(email: Email): Promise<boolean>
}
