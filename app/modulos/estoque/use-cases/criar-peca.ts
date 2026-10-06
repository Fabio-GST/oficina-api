import type { CasoDeUso } from '#shared/use-cases/caso-de-uso'
import { Dinheiro } from '#shared/entities/objetos-de-valor/dinheiro'
import { coletarEventosDe } from '#shared/use-cases/coletor-de-eventos'
import type { RepositorioDePecas } from './ports/repositorio-de-pecas.js'
import { Peca } from '../entities/peca.js'
import { QuantidadeEstoque } from '../entities/objetos-de-valor/quantidade-estoque.js'
import { paraDTO, type PecaDTO } from './dtos.js'

export interface EntradaCriarPeca {
  nome: string
  descricao?: string | null
  preco: number
  quantidadeEstoque: number
  estoqueMinimo?: number
}

/** Cadastra uma peça no estoque com preço e quantidade inicial. */
export class CriarPeca implements CasoDeUso<EntradaCriarPeca, PecaDTO> {
  constructor(private readonly repositorio: RepositorioDePecas) {}

  async executar(entrada: EntradaCriarPeca): Promise<PecaDTO> {
    const peca = Peca.criar({
      nome: entrada.nome,
      descricao: entrada.descricao,
      preco: Dinheiro.deReais(entrada.preco),
      quantidadeEstoque: QuantidadeEstoque.criar(entrada.quantidadeEstoque),
      estoqueMinimo: entrada.estoqueMinimo,
    })
    await this.repositorio.salvar(peca)
    await coletarEventosDe(peca)
    return paraDTO(peca)
  }
}
