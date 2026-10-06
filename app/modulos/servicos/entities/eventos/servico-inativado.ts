import type { EventoDeDominio } from '#shared/entities/evento-de-dominio'

/** Disparado quando um serviço é inativado (não pode mais entrar em novas OS). */
export class ServicoInativado implements EventoDeDominio {
  readonly nome = 'servicos.inativado'
  readonly ocorridoEm = new Date()

  constructor(readonly servicoId: string) {}
}
