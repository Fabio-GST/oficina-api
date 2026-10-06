/**
 * Dados que orientam a entrega da notificação. `destinatarioEmail`/
 * `destinatarioNome` são usados pelos adaptadores com canal real (e-mail);
 * demais chaves são contexto livre para rastreio/log.
 */
export interface ContextoNotificacao extends Record<string, unknown> {
  destinatarioEmail?: string | null
  destinatarioNome?: string | null
}

/**
 * Porta de notificação. Abstrai o envio de avisos a clientes e ao almoxarife,
 * acionado por Políticas (ex.: "avisar cliente" ao finalizar a OS, alertar o
 * almoxarife quando o estoque atinge o mínimo). As implementações concretas
 * vivem na infraestrutura (log e e-mail/SMTP; selecionadas por configuração).
 */
export interface ServicoDeNotificacao {
  notificarCliente(mensagem: string, contexto?: ContextoNotificacao): Promise<void>
  notificarAlmoxarife(mensagem: string, contexto?: ContextoNotificacao): Promise<void>
}
