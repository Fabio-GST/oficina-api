import type { EventoDeDominio } from '#shared/entities/evento-de-dominio'

/**
 * Disparado ao identificar um cliente por documento. Quando `encontrado` é
 * falso, habilita a Política "se não encontrado, dispara cadastro" (Fase 2).
 */
export class BuscaDeClienteRealizada implements EventoDeDominio {
  readonly nome = 'clientes.busca-realizada'
  readonly ocorridoEm = new Date()

  constructor(
    readonly documento: string,
    readonly encontrado: boolean,
    readonly clienteId?: string
  ) {}
}
