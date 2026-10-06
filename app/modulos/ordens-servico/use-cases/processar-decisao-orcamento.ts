import type { CasoDeUso } from '#shared/use-cases/caso-de-uso'
import { RecursoNaoEncontrado } from '#shared/entities/erros'
import { coletarEventosDe } from '#shared/use-cases/coletor-de-eventos'
import type { RepositorioDeOrdensServico } from './ports/repositorio-de-ordens-servico.js'
import { StatusOS } from '../entities/objetos-de-valor/status-ordem-servico.js'
import { paraDTO, type OrdemServicoDTO } from './dtos.js'

export type DecisaoOrcamento = 'APROVADO' | 'RECUSADO'

export interface EntradaProcessarDecisao {
  ordemId: string
  decisao: DecisaoOrcamento
}

/** Status que indicam que a aprovação já foi aplicada (ou superada). */
const STATUS_POS_APROVACAO = [StatusOS.EM_EXECUCAO, StatusOS.FINALIZADA, StatusOS.ENTREGUE]

/**
 * Processa a notificação externa (webhook) da decisão do cliente sobre o
 * orçamento. **Idempotente**: se a OS já reflete a decisão recebida, o reenvio
 * retorna o estado atual sem alterá-lo nem falhar — integradores externos podem
 * repetir a notificação com segurança.
 */
export class ProcessarDecisaoOrcamento implements CasoDeUso<
  EntradaProcessarDecisao,
  OrdemServicoDTO
> {
  constructor(private readonly ordens: RepositorioDeOrdensServico) {}

  async executar(entrada: EntradaProcessarDecisao): Promise<OrdemServicoDTO> {
    const ordem = await this.ordens.buscarPorId(entrada.ordemId)
    if (!ordem) {
      throw new RecursoNaoEncontrado('Ordem de Serviço', entrada.ordemId)
    }

    if (this.decisaoJaAplicada(entrada.decisao, ordem.status.valor)) {
      return paraDTO(ordem)
    }

    if (entrada.decisao === 'APROVADO') {
      ordem.aprovar()
    } else {
      ordem.recusar()
    }

    await this.ordens.salvar(ordem)
    await coletarEventosDe(ordem)
    return paraDTO(ordem)
  }

  private decisaoJaAplicada(decisao: DecisaoOrcamento, status: StatusOS): boolean {
    if (decisao === 'APROVADO') return STATUS_POS_APROVACAO.includes(status)
    return status === StatusOS.RECUSADA
  }
}
