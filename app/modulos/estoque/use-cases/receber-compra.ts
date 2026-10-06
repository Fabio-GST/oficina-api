import type { CasoDeUso } from '#shared/use-cases/caso-de-uso'
import { RecursoNaoEncontrado } from '#shared/entities/erros'
import type { UnidadeDeTrabalho } from '#shared/use-cases/unidade-de-trabalho'
import { coletarEventosDe } from '#shared/use-cases/coletor-de-eventos'
import type { RepositorioDePecas } from './ports/repositorio-de-pecas.js'
import type { RepositorioDeSolicitacoesCompra } from './ports/repositorio-de-solicitacoes-compra.js'
import { solicitacaoParaDTO, type SolicitacaoCompraDTO } from './dtos.js'

/**
 * Recebe uma compra: marca a solicitação como recebida e repõe o estoque da
 * peça, de forma atômica (Unidade de Trabalho). Publica `estoque.peca-recebida`.
 */
export class ReceberCompra implements CasoDeUso<string, SolicitacaoCompraDTO> {
  constructor(
    private readonly solicitacoes: RepositorioDeSolicitacoesCompra,
    private readonly pecas: RepositorioDePecas,
    private readonly unidadeDeTrabalho: UnidadeDeTrabalho
  ) {}

  async executar(solicitacaoId: string): Promise<SolicitacaoCompraDTO> {
    return this.unidadeDeTrabalho.executar(async () => {
      const solicitacao = await this.solicitacoes.buscarPorId(solicitacaoId)
      if (!solicitacao) {
        throw new RecursoNaoEncontrado('Solicitação de compra', solicitacaoId)
      }
      const peca = await this.pecas.buscarPorId(solicitacao.pecaId)
      /* c8 ignore next 3 -- guarda defensiva: a FK garante que a peça da solicitação existe */
      if (!peca) {
        throw new RecursoNaoEncontrado('Peça', solicitacao.pecaId)
      }

      solicitacao.receber()
      peca.receber(solicitacao.quantidade)

      await this.solicitacoes.salvar(solicitacao)
      await this.pecas.salvar(peca)
      await coletarEventosDe(solicitacao)
      await coletarEventosDe(peca)
      return solicitacaoParaDTO(solicitacao)
    })
  }
}
