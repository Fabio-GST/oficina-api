import type { CasoDeUso } from '#shared/use-cases/caso-de-uso'
import { RecursoNaoEncontrado } from '#shared/entities/erros'
import { coletarEventosDe } from '#shared/use-cases/coletor-de-eventos'
import type { RepositorioDeOrdensServico } from './ports/repositorio-de-ordens-servico.js'
import type { OrdemServico } from '../entities/ordem-servico.js'
import { StatusOS } from '../entities/objetos-de-valor/status-ordem-servico.js'
import { paraDTO, type OrdemServicoDTO } from './dtos.js'

export interface EntradaAlterarStatus {
  ordemId: string
  novoStatus: StatusOS
}

/** Avança o status da OS respeitando a máquina de estados. */
export class AlterarStatusDaOrdem implements CasoDeUso<EntradaAlterarStatus, OrdemServicoDTO> {
  constructor(private readonly ordens: RepositorioDeOrdensServico) {}

  async executar(entrada: EntradaAlterarStatus): Promise<OrdemServicoDTO> {
    const ordem = await this.ordens.buscarPorId(entrada.ordemId)
    if (!ordem) {
      throw new RecursoNaoEncontrado('Ordem de Serviço', entrada.ordemId)
    }
    ordem.transitarPara(entrada.novoStatus)
    await this.ordens.salvar(ordem)
    return paraDTO(ordem)
  }
}

/**
 * Aplica um comando do ciclo de vida da OS (carregar → executar → salvar →
 * publicar eventos), centralizando o padrão comum dos comandos abaixo.
 */
abstract class ComandoDeCicloDeVida implements CasoDeUso<string, OrdemServicoDTO> {
  constructor(protected readonly ordens: RepositorioDeOrdensServico) {}

  async executar(ordemId: string): Promise<OrdemServicoDTO> {
    const ordem = await this.ordens.buscarPorId(ordemId)
    if (!ordem) {
      throw new RecursoNaoEncontrado('Ordem de Serviço', ordemId)
    }
    this.aplicar(ordem)
    await this.ordens.salvar(ordem)
    await coletarEventosDe(ordem)
    return paraDTO(ordem)
  }

  protected abstract aplicar(ordem: OrdemServico): void
}

/** Aprovação do orçamento pelo cliente (AGUARDANDO_APROVACAO → EM_EXECUCAO). */
export class AprovarOrdemServico extends ComandoDeCicloDeVida {
  protected aplicar(ordem: OrdemServico): void {
    ordem.aprovar()
  }
}

/** Início do diagnóstico (RECEBIDA → EM_DIAGNOSTICO). */
export class IniciarDiagnostico extends ComandoDeCicloDeVida {
  protected aplicar(ordem: OrdemServico): void {
    ordem.iniciarDiagnostico()
  }
}

/** Geração do orçamento (EM_DIAGNOSTICO → AGUARDANDO_APROVACAO). */
export class GerarOrcamento extends ComandoDeCicloDeVida {
  protected aplicar(ordem: OrdemServico): void {
    ordem.gerarOrcamento()
  }
}

/** Recusa do orçamento pelo cliente (AGUARDANDO_APROVACAO → RECUSADA). */
export class RecusarOrdemServico extends ComandoDeCicloDeVida {
  protected aplicar(ordem: OrdemServico): void {
    ordem.recusar()
  }
}

/** Renegociação (AGUARDANDO_APROVACAO → EM_DIAGNOSTICO). */
export class RenegociarOrdemServico extends ComandoDeCicloDeVida {
  protected aplicar(ordem: OrdemServico): void {
    ordem.renegociar()
  }
}

/** Finalização da execução (EM_EXECUCAO → FINALIZADA). */
export class FinalizarOrdemServico extends ComandoDeCicloDeVida {
  protected aplicar(ordem: OrdemServico): void {
    ordem.finalizar()
  }
}

/** Entrega do veículo (FINALIZADA → ENTREGUE). */
export class EntregarVeiculo extends ComandoDeCicloDeVida {
  protected aplicar(ordem: OrdemServico): void {
    ordem.entregar()
  }
}
