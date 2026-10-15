import type { Cliente } from '../entities/cliente.js'

export interface ClienteDTO {
  id: string
  nome: string
  documento: string
  tipoDocumento: 'CPF' | 'CNPJ'
  telefone: string | null
  email: string | null
  ativo: boolean
}

export function paraDTO(cliente: Cliente): ClienteDTO {
  return {
    id: cliente.id,
    nome: cliente.nome,
    documento: cliente.documento.valor,
    tipoDocumento: cliente.documento.tipo,
    telefone: cliente.telefone,
    email: cliente.email,
    ativo: cliente.ativo,
  }
}
