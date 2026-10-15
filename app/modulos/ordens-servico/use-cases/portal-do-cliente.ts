import type { CasoDeUso } from '#shared/use-cases/caso-de-uso'
import { RecursoNaoEncontrado } from '#shared/entities/erros'
import type { RepositorioDeOrdensServico } from './ports/repositorio-de-ordens-servico.js'
import type { OrdemServico } from '../entities/ordem-servico.js'
import { AprovarOrdemServico, RecusarOrdemServico } from './gerir-status.js'
import { paraDTO, type OrdemServicoDTO } from './dtos.js'

/**
 * Casos de uso do **portal do cliente**: o portador é um cliente autenticado
 * por CPF (JWT emitido pela Function Serverless, `papel: 'cliente'`,
 * `sub` = id do cliente). Todo acesso é restrito às ordens do próprio cliente;
 * uma OS de outro cliente responde 404, sem revelar que existe.
 */
export interface EntradaDoCliente {
  clienteId: string
  ordemId: string
}

async function carregarOrdemDoCliente(
  ordens: RepositorioDeOrdensServico,
  { clienteId, ordemId }: EntradaDoCliente
): Promise<OrdemServico> {
  const ordem = await ordens.buscarPorId(ordemId)
  if (!ordem || ordem.clienteId !== clienteId) {
    throw new RecursoNaoEncontrado('Ordem de Serviço', ordemId)
  }
  return ordem
}

/** Lista as OS do cliente autenticado (todas, inclusive finalizadas), mais recentes primeiro. */
export class ListarMinhasOrdens implements CasoDeUso<string, OrdemServicoDTO[]> {
  constructor(private readonly ordens: RepositorioDeOrdensServico) {}

  async executar(clienteId: string): Promise<OrdemServicoDTO[]> {
    const ordens = await this.ordens.listarPorCliente(clienteId)
    return ordens.map(paraDTO)
  }
}

/** Detalha uma OS do cliente autenticado (itens, orçamento e histórico). */
export class DetalharMinhaOrdem implements CasoDeUso<EntradaDoCliente, OrdemServicoDTO> {
  constructor(private readonly ordens: RepositorioDeOrdensServico) {}

  async executar(entrada: EntradaDoCliente): Promise<OrdemServicoDTO> {
    return paraDTO(await carregarOrdemDoCliente(this.ordens, entrada))
  }
}

/** O cliente aprova o orçamento da própria OS (AGUARDANDO_APROVACAO → EM_EXECUCAO). */
export class AprovarMinhaOrdem implements CasoDeUso<EntradaDoCliente, OrdemServicoDTO> {
  constructor(
    private readonly ordens: RepositorioDeOrdensServico,
    private readonly aprovar: AprovarOrdemServico
  ) {}

  async executar(entrada: EntradaDoCliente): Promise<OrdemServicoDTO> {
    await carregarOrdemDoCliente(this.ordens, entrada)
    return this.aprovar.executar(entrada.ordemId)
  }
}

/** O cliente recusa o orçamento da própria OS (AGUARDANDO_APROVACAO → RECUSADA). */
export class RecusarMinhaOrdem implements CasoDeUso<EntradaDoCliente, OrdemServicoDTO> {
  constructor(
    private readonly ordens: RepositorioDeOrdensServico,
    private readonly recusar: RecusarOrdemServico
  ) {}

  async executar(entrada: EntradaDoCliente): Promise<OrdemServicoDTO> {
    await carregarOrdemDoCliente(this.ordens, entrada)
    return this.recusar.executar(entrada.ordemId)
  }
}
