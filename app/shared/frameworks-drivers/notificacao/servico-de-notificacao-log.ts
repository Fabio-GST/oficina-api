import logger from '@adonisjs/core/services/logger'
import type { ServicoDeNotificacao } from '#shared/use-cases/servico-de-notificacao'

/**
 * Implementação stub do serviço de notificação: apenas registra em log. Serve de
 * placeholder até a integração com um canal real (e-mail/SMS/push).
 */
export class ServicoDeNotificacaoLog implements ServicoDeNotificacao {
  async notificarCliente(mensagem: string, contexto?: Record<string, unknown>): Promise<void> {
    logger.info({ destinatario: 'cliente', ...contexto }, `[notificação] ${mensagem}`)
  }

  async notificarAlmoxarife(mensagem: string, contexto?: Record<string, unknown>): Promise<void> {
    logger.info({ destinatario: 'almoxarife', ...contexto }, `[notificação] ${mensagem}`)
  }
}

export const servicoDeNotificacao = new ServicoDeNotificacaoLog()
