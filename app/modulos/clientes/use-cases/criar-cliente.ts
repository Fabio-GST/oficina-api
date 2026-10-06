import type { CasoDeUso } from '#shared/use-cases/caso-de-uso'
import { ConflitoDeRecurso } from '#shared/entities/erros'
import { coletarEventosDe } from '#shared/use-cases/coletor-de-eventos'
import type { RepositorioDeClientes } from './ports/repositorio-de-clientes.js'
import { Cliente } from '../entities/cliente.js'
import { Documento } from '../entities/objetos-de-valor/documento.js'
import { paraDTO, type ClienteDTO } from './dtos.js'

export interface EntradaCriarCliente {
  nome: string
  documento: string
  telefone?: string | null
  email?: string | null
}

/** Cadastra um cliente, garantindo unicidade do documento (CPF/CNPJ). */
export class CriarCliente implements CasoDeUso<EntradaCriarCliente, ClienteDTO> {
  constructor(private readonly repositorio: RepositorioDeClientes) {}

  async executar(entrada: EntradaCriarCliente): Promise<ClienteDTO> {
    const documento = Documento.criar(entrada.documento)

    if (await this.repositorio.existeComDocumento(documento)) {
      throw new ConflitoDeRecurso(`Já existe um cliente com o documento ${documento.valor}.`)
    }

    const cliente = Cliente.criar({
      nome: entrada.nome,
      documento,
      telefone: entrada.telefone,
      email: entrada.email,
    })
    await this.repositorio.salvar(cliente)
    await coletarEventosDe(cliente)
    return paraDTO(cliente)
  }
}
