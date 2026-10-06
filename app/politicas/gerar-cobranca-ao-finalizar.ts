import type { ManipuladorDeEvento } from '#shared/use-cases/manipulador-de-evento'
import type { ServicoDeNotificacao } from '#shared/use-cases/servico-de-notificacao'
import type { OrdemServicoFinalizada } from '#modulos/ordens-servico/entities/eventos/ordem-servico-finalizada'
import type { OrdemServicoDTO } from '#modulos/ordens-servico/use-cases/dtos'
import type { BuscarDestinatarioDaOrdem } from './notificar-cliente-sobre-os.js'

type ObterOrdem = (ordemId: string) => Promise<OrdemServicoDTO>
type GerarCobrancaCmd = (entrada: { ordemId: string; total: number }) => Promise<unknown>

/**
 * Política: ao finalizar a OS, gera a cobrança no contexto de Pagamento e avisa
 * o cliente. Desacopla a OS do Pagamento — a OS apenas anuncia que terminou.
 */
export class GerarCobrancaAoFinalizar implements ManipuladorDeEvento<OrdemServicoFinalizada> {
  readonly evento = 'ordem-servico.finalizada'

  constructor(
    private readonly obterOrdem: ObterOrdem,
    private readonly gerarCobranca: GerarCobrancaCmd,
    private readonly notificacao: ServicoDeNotificacao,
    private readonly buscarDestinatario?: BuscarDestinatarioDaOrdem
  ) {}

  async manipular(evento: OrdemServicoFinalizada): Promise<void> {
    const ordem = await this.obterOrdem(evento.ordemServicoId)
    if (ordem.orcamento > 0) {
      await this.gerarCobranca({ ordemId: ordem.id, total: ordem.orcamento })
    }
    const destinatario = await this.buscarDestinatario?.(ordem.id)
    await this.notificacao.notificarCliente('Sua Ordem de Serviço foi finalizada.', {
      ordemServicoId: ordem.id,
      clienteId: ordem.clienteId,
      destinatarioEmail: destinatario?.email,
      destinatarioNome: destinatario?.nome,
    })
  }
}
