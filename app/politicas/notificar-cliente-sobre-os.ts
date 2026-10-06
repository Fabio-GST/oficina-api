import type { EventoDeDominio } from '#shared/entities/evento-de-dominio'
import type { ManipuladorDeEvento } from '#shared/use-cases/manipulador-de-evento'
import type { ServicoDeNotificacao } from '#shared/use-cases/servico-de-notificacao'

interface EventoComOrdem extends EventoDeDominio {
  ordemServicoId: string
}

export interface DestinatarioDaOrdem {
  nome?: string | null
  email?: string | null
}

/** Resolve o destinatário (cliente) a partir da OS do evento. */
export type BuscarDestinatarioDaOrdem = (
  ordemServicoId: string
) => Promise<DestinatarioDaOrdem | null>

/**
 * Política genérica de "avisar o cliente" sobre marcos da OS (aprovação,
 * entrega etc.). Inscreve-se em um evento e dispara uma notificação. Quando um
 * resolvedor de destinatário é fornecido, o aviso carrega nome/e-mail do
 * cliente — habilitando canais reais como e-mail.
 */
export class NotificarClienteSobreOS implements ManipuladorDeEvento<EventoComOrdem> {
  constructor(
    readonly evento: string,
    private readonly mensagem: string,
    private readonly notificacao: ServicoDeNotificacao,
    private readonly buscarDestinatario?: BuscarDestinatarioDaOrdem
  ) {}

  async manipular(evento: EventoComOrdem): Promise<void> {
    const destinatario = await this.buscarDestinatario?.(evento.ordemServicoId)
    await this.notificacao.notificarCliente(this.mensagem, {
      ordemServicoId: evento.ordemServicoId,
      destinatarioEmail: destinatario?.email,
      destinatarioNome: destinatario?.nome,
    })
  }
}
