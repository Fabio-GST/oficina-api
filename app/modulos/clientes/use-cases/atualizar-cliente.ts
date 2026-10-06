import type { CasoDeUso } from '#shared/use-cases/caso-de-uso'
import { RecursoNaoEncontrado } from '#shared/entities/erros'
import type { RepositorioDeClientes } from './ports/repositorio-de-clientes.js'
import { paraDTO, type ClienteDTO } from './dtos.js'

export interface EntradaAtualizarCliente {
  id: string
  nome?: string
  telefone?: string | null
  email?: string | null
}

/** Atualiza os dados cadastrais de um cliente (documento é imutável). */
export class AtualizarCliente implements CasoDeUso<EntradaAtualizarCliente, ClienteDTO> {
  constructor(private readonly repositorio: RepositorioDeClientes) {}

  async executar(entrada: EntradaAtualizarCliente): Promise<ClienteDTO> {
    const cliente = await this.repositorio.buscarPorId(entrada.id)
    if (!cliente) {
      throw new RecursoNaoEncontrado('Cliente', entrada.id)
    }
    cliente.atualizar({ nome: entrada.nome, telefone: entrada.telefone, email: entrada.email })
    await this.repositorio.salvar(cliente)
    return paraDTO(cliente)
  }
}
