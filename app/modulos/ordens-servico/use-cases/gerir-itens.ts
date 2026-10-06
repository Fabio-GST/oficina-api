import type { CasoDeUso } from '#shared/use-cases/caso-de-uso'
import { RecursoNaoEncontrado, RegraDeNegocioViolada } from '#shared/entities/erros'
import type { UnidadeDeTrabalho } from '#shared/use-cases/unidade-de-trabalho'
import type { PortalDeCatalogoDeServicos } from './ports/portal-de-catalogo-de-servicos.js'
import type { PortalDeEstoque } from './ports/portal-de-estoque.js'
import type { RepositorioDeOrdensServico } from './ports/repositorio-de-ordens-servico.js'
import { paraDTO, type OrdemServicoDTO } from './dtos.js'

export interface EntradaAdicionarServico {
  ordemId: string
  servicoId: string
  quantidade: number
}

/** Inclui um serviço em uma OS existente, recompondo o orçamento. */
export class AdicionarServicoNaOrdem implements CasoDeUso<
  EntradaAdicionarServico,
  OrdemServicoDTO
> {
  constructor(
    private readonly ordens: RepositorioDeOrdensServico,
    private readonly catalogo: PortalDeCatalogoDeServicos
  ) {}

  async executar(entrada: EntradaAdicionarServico): Promise<OrdemServicoDTO> {
    const ordem = await this.ordens.buscarPorId(entrada.ordemId)
    if (!ordem) {
      throw new RecursoNaoEncontrado('Ordem de Serviço', entrada.ordemId)
    }
    const servico = await this.catalogo.obterServico(entrada.servicoId)
    if (!servico) {
      throw new RecursoNaoEncontrado('Serviço', entrada.servicoId)
    }
    if (!servico.ativo) {
      throw new RegraDeNegocioViolada(`O serviço "${servico.nome}" está inativo.`)
    }

    ordem.adicionarServico({
      servicoId: servico.id,
      descricao: servico.nome,
      precoUnitario: servico.preco,
      quantidade: entrada.quantidade,
    })
    await this.ordens.salvar(ordem)
    return paraDTO(ordem)
  }
}

export interface EntradaAdicionarPeca {
  ordemId: string
  pecaId: string
  quantidade: number
}

/**
 * Inclui uma peça em uma OS existente, **reservando** o estoque de forma atômica
 * com a atualização da OS. A reserva delega ao caso de uso do Estoque via porta
 * ACL. A baixa efetiva ocorre na aprovação da OS (Política).
 */
export class AdicionarPecaNaOrdem implements CasoDeUso<EntradaAdicionarPeca, OrdemServicoDTO> {
  constructor(
    private readonly ordens: RepositorioDeOrdensServico,
    private readonly estoque: PortalDeEstoque,
    private readonly unidadeDeTrabalho: UnidadeDeTrabalho
  ) {}

  async executar(entrada: EntradaAdicionarPeca): Promise<OrdemServicoDTO> {
    return this.unidadeDeTrabalho.executar(async () => {
      const ordem = await this.ordens.buscarPorId(entrada.ordemId)
      if (!ordem) {
        throw new RecursoNaoEncontrado('Ordem de Serviço', entrada.ordemId)
      }
      const peca = await this.estoque.obterPeca(entrada.pecaId)
      if (!peca) {
        throw new RecursoNaoEncontrado('Peça', entrada.pecaId)
      }

      await this.estoque.reservar(peca.id, entrada.quantidade)
      ordem.adicionarPeca({
        pecaId: peca.id,
        descricao: peca.nome,
        precoUnitario: peca.preco,
        quantidade: entrada.quantidade,
      })

      await this.ordens.salvar(ordem)
      return paraDTO(ordem)
    })
  }
}
