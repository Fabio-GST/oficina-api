import { Cliente } from '../../entities/cliente.js'
import { Documento } from '../../entities/objetos-de-valor/documento.js'
import type ClienteModel from '../../frameworks-drivers/models/cliente_model.js'

export const MapeadorDeCliente = {
  paraDominio(model: ClienteModel): Cliente {
    return Cliente.reconstituir({
      id: model.id,
      nome: model.nome,
      documento: Documento.criar(model.documento),
      telefone: model.telefone,
      email: model.email,
    })
  },

  paraPersistencia(cliente: Cliente) {
    return {
      id: cliente.id,
      nome: cliente.nome,
      documento: cliente.documento.valor,
      tipoDocumento: cliente.documento.tipo,
      telefone: cliente.telefone,
      email: cliente.email,
    }
  },
}
