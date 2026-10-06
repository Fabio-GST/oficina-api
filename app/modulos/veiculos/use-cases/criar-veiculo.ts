import type { CasoDeUso } from '#shared/use-cases/caso-de-uso'
import { ConflitoDeRecurso, RecursoNaoEncontrado } from '#shared/entities/erros'
import { coletarEventosDe } from '#shared/use-cases/coletor-de-eventos'
import type { PortalDeClientes } from './ports/portal-de-clientes.js'
import type { RepositorioDeVeiculos } from './ports/repositorio-de-veiculos.js'
import { Veiculo } from '../entities/veiculo.js'
import { Placa } from '../entities/objetos-de-valor/placa.js'
import { paraDTO, type VeiculoDTO } from './dtos.js'

export interface EntradaCriarVeiculo {
  clienteId: string
  placa: string
  marca: string
  modelo: string
  ano: number
}

/** Cadastra um veículo para um cliente, garantindo unicidade da placa. */
export class CriarVeiculo implements CasoDeUso<EntradaCriarVeiculo, VeiculoDTO> {
  constructor(
    private readonly repositorio: RepositorioDeVeiculos,
    private readonly clientes: PortalDeClientes
  ) {}

  async executar(entrada: EntradaCriarVeiculo): Promise<VeiculoDTO> {
    if (!(await this.clientes.clienteExiste(entrada.clienteId))) {
      throw new RecursoNaoEncontrado('Cliente', entrada.clienteId)
    }

    const placa = Placa.criar(entrada.placa)
    if (await this.repositorio.existeComPlaca(placa)) {
      throw new ConflitoDeRecurso(`Já existe um veículo com a placa ${placa.valor}.`)
    }

    const veiculo = Veiculo.criar({
      clienteId: entrada.clienteId,
      placa,
      marca: entrada.marca,
      modelo: entrada.modelo,
      ano: entrada.ano,
    })
    await this.repositorio.salvar(veiculo)
    await coletarEventosDe(veiculo)
    return paraDTO(veiculo)
  }
}
