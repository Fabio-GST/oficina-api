import type { EventoDeDominio } from '#shared/entities/evento-de-dominio'

/** Disparado quando um novo serviço é cadastrado no catálogo. */
export class ServicoCadastrado implements EventoDeDominio {
  readonly nome = 'servicos.cadastrado'
  readonly ocorridoEm = new Date()

  constructor(readonly servicoId: string) {}
}
