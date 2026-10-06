import type { CasoDeUso } from '#shared/use-cases/caso-de-uso'
import { publicarEventos } from '#shared/use-cases/coletor-de-eventos'
import type { RepositorioDeVeiculos } from './ports/repositorio-de-veiculos.js'
import { Placa } from '../entities/objetos-de-valor/placa.js'
import { BuscaDeVeiculoRealizada } from '../entities/eventos/busca-de-veiculo-realizada.js'
import { paraDTO, type VeiculoDTO } from './dtos.js'

/**
 * Busca um veículo pela placa. Publica `veiculos.busca-realizada` indicando se
 * foi encontrado — base para a Política "se não encontrado, dispara cadastro".
 */
export class BuscarVeiculoPorPlaca implements CasoDeUso<string, VeiculoDTO | null> {
  constructor(private readonly repositorio: RepositorioDeVeiculos) {}

  async executar(placaBruta: string): Promise<VeiculoDTO | null> {
    const placa = Placa.criar(placaBruta)
    const veiculo = await this.repositorio.buscarPorPlaca(placa)
    await publicarEventos([new BuscaDeVeiculoRealizada(placa.valor, veiculo !== null, veiculo?.id)])
    return veiculo ? paraDTO(veiculo) : null
  }
}
