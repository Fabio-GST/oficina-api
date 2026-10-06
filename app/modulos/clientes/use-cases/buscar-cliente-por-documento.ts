import type { CasoDeUso } from '#shared/use-cases/caso-de-uso'
import { publicarEventos } from '#shared/use-cases/coletor-de-eventos'
import type { RepositorioDeClientes } from './ports/repositorio-de-clientes.js'
import { Documento } from '../entities/objetos-de-valor/documento.js'
import { BuscaDeClienteRealizada } from '../entities/eventos/busca-de-cliente-realizada.js'
import { paraDTO, type ClienteDTO } from './dtos.js'

/**
 * Identifica um cliente pelo documento (CPF/CNPJ). Publica
 * `clientes.busca-realizada` indicando se foi encontrado — base para a Política
 * "se não encontrado, dispara cadastro".
 */
export class BuscarClientePorDocumento implements CasoDeUso<string, ClienteDTO | null> {
  constructor(private readonly repositorio: RepositorioDeClientes) {}

  async executar(documentoBruto: string): Promise<ClienteDTO | null> {
    const documento = Documento.criar(documentoBruto)
    const cliente = await this.repositorio.buscarPorDocumento(documento)
    await publicarEventos([
      new BuscaDeClienteRealizada(documento.valor, cliente !== null, cliente?.id),
    ])
    return cliente ? paraDTO(cliente) : null
  }
}
