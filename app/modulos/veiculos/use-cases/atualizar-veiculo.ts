import type { CasoDeUso } from '#shared/use-cases/caso-de-uso'
import { RecursoNaoEncontrado } from '#shared/entities/erros'
import type { RepositorioDeVeiculos } from './ports/repositorio-de-veiculos.js'
import { paraDTO, type VeiculoDTO } from './dtos.js'

export interface EntradaAtualizarVeiculo {
  id: string
  marca?: string
  modelo?: string
  ano?: number
}

/** Atualiza os dados cadastrais (marca, modelo, ano) de um veículo. */
export class AtualizarVeiculo implements CasoDeUso<EntradaAtualizarVeiculo, VeiculoDTO> {
  constructor(private readonly repositorio: RepositorioDeVeiculos) {}

  async executar(entrada: EntradaAtualizarVeiculo): Promise<VeiculoDTO> {
    const veiculo = await this.repositorio.buscarPorId(entrada.id)
    if (!veiculo) {
      throw new RecursoNaoEncontrado('Veículo', entrada.id)
    }
    veiculo.atualizar({ marca: entrada.marca, modelo: entrada.modelo, ano: entrada.ano })
    await this.repositorio.salvar(veiculo)
    return paraDTO(veiculo)
  }
}
