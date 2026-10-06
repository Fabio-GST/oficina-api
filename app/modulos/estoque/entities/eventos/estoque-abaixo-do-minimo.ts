import type { EventoDeDominio } from '#shared/entities/evento-de-dominio'

/**
 * Disparado quando o disponível de uma peça cai abaixo do estoque mínimo.
 * Habilita a Política de alerta ao almoxarife / solicitação de compra (Fase 2).
 */
export class EstoqueAbaixoDoMinimo implements EventoDeDominio {
  readonly nome = 'estoque.abaixo-do-minimo'
  readonly ocorridoEm = new Date()

  constructor(
    readonly pecaId: string,
    readonly disponivel: number,
    readonly minimo: number
  ) {}
}
