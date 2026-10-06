import { Cliente } from '../../entities/cliente.js'
import { Documento } from '../../entities/objetos-de-valor/documento.js'

export interface RepositorioDeClientes {
  salvar(cliente: Cliente): Promise<void>
  buscarPorId(id: string): Promise<Cliente | null>
  buscarPorDocumento(documento: Documento): Promise<Cliente | null>
  existeComDocumento(documento: Documento): Promise<boolean>
  listar(): Promise<Cliente[]>
  remover(id: string): Promise<void>
}
