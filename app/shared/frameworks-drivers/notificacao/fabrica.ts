import nodemailer from 'nodemailer'
import env from '#start/env'
import type { ServicoDeNotificacao } from '#shared/use-cases/servico-de-notificacao'
import { ServicoDeNotificacaoLog } from './servico-de-notificacao-log.js'
import { ServicoDeNotificacaoEmail } from './servico-de-notificacao-email.js'

/**
 * Seleciona a implementação da porta de notificação pela configuração:
 * `NOTIFICACAO_DRIVER=email` ativa o envio real via SMTP; qualquer outro valor
 * (ou ausência) usa o registro em log — padrão seguro para dev e testes.
 */
function criarServicoDeNotificacao(): ServicoDeNotificacao {
  if (env.get('NOTIFICACAO_DRIVER', 'log') !== 'email') {
    return new ServicoDeNotificacaoLog()
  }

  const usuario = env.get('SMTP_USER')
  const transporte = nodemailer.createTransport({
    host: env.get('SMTP_HOST'),
    port: env.get('SMTP_PORT', 587),
    auth: usuario ? { user: usuario, pass: env.get('SMTP_PASSWORD') } : undefined,
  })

  return new ServicoDeNotificacaoEmail(transporte, {
    remetente: env.get('MAIL_FROM', 'oficina@localhost'),
    emailAlmoxarife: env.get('EMAIL_ALMOXARIFE'),
  })
}

export const servicoDeNotificacao = criarServicoDeNotificacao()
