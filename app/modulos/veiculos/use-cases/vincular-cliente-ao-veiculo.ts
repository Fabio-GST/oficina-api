import type { CasoDeUso } from '#shared/use-cases/caso-de-uso'
import { RecursoNaoEncontrado } from '#shared/entities/erros'
import { coletarEventosDe } from '#shared/use-cases/coletor-de-eventos'
import type { PortalDeClientes } from './ports/portal-de-clientes.js'
import type { RepositorioDeVeiculos } from './ports/repositorio-de-veiculos.js'
import { paraDTO, type VeiculoDTO } from './dtos.js'

export interface EntradaVincularCliente {
  id: string
  clienteId: string
}

/** Vincula (ou transfere) um veículo existente a um cliente. */
export class VincularClienteAoVeiculo implements CasoDeUso<EntradaVincularCliente, VeiculoDTO> {
  constructor(
    private readonly repositorio: RepositorioDeVeiculos,
    private readonly clientes: PortalDeClientes
  ) {}

  async executar(entrada: EntradaVincularCliente): Promise<VeiculoDTO> {
    const veiculo = await this.repositorio.buscarPorId(entrada.id)
    if (!veiculo) {
      throw new RecursoNaoEncontrado('Veículo', entrada.id)
    }
    if (!(await this.clientes.clienteExiste(entrada.clienteId))) {
      throw new RecursoNaoEncontrado('Cliente', entrada.clienteId)
    }
    veiculo.vincularCliente(entrada.clienteId)
    await this.repositorio.salvar(veiculo)
    await coletarEventosDe(veiculo)
    return paraDTO(veiculo)
  }
}
