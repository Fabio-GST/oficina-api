import logger from '@adonisjs/core/services/logger'
import type { Transporter } from 'nodemailer'
import type {
  ContextoNotificacao,
  ServicoDeNotificacao,
} from '#shared/use-cases/servico-de-notificacao'

export interface OpcoesDeEmail {
  /** Endereço usado no campo "from" das mensagens. */
  remetente: string
  /** Destino dos alertas de estoque; sem ele, o aviso cai no log. */
  emailAlmoxarife?: string
}

/**
 * Adaptador de e-mail (SMTP via nodemailer) da porta de notificação. Falhas de
 * envio são registradas e **não propagadas**: notificar é efeito colateral e não
 * pode derrubar o fluxo de negócio que a originou. Sem destinatário conhecido,
 * a mensagem é apenas registrada em log.
 */
export class ServicoDeNotificacaoEmail implements ServicoDeNotificacao {
  constructor(
    private readonly transporte: Transporter,
    private readonly opcoes: OpcoesDeEmail
  ) {}

  async notificarCliente(mensagem: string, contexto?: ContextoNotificacao): Promise<void> {
    await this.enviar(
      contexto?.destinatarioEmail ?? undefined,
      'Atualização da sua Ordem de Serviço',
      mensagem,
      contexto
    )
  }

  async notificarAlmoxarife(mensagem: string, contexto?: ContextoNotificacao): Promise<void> {
    await this.enviar(this.opcoes.emailAlmoxarife, 'Alerta de estoque', mensagem, contexto)
  }

  private async enviar(
    para: string | undefined,
    assunto: string,
    mensagem: string,
    contexto?: ContextoNotificacao
  ): Promise<void> {
    if (!para) {
      logger.info({ ...contexto }, `[notificação sem destinatário] ${mensagem}`)
      return
    }

    try {
      await this.transporte.sendMail({
        from: this.opcoes.remetente,
        to: para,
        subject: assunto,
        text: mensagem,
      })
      logger.info({ para, ...contexto }, `[notificação enviada] ${mensagem}`)
    } catch (erro) {
      logger.error({ para, erro, ...contexto }, `[notificação falhou] ${mensagem}`)
    }
  }
}
