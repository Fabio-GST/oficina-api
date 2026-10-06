import type { EventoDeDominio } from '#shared/entities/evento-de-dominio'

/** Disparado quando o preço de um serviço é atualizado na tabela. */
export class PrecoDeServicoAtualizado implements EventoDeDominio {
  readonly nome = 'servicos.preco-atualizado'
  readonly ocorridoEm = new Date()

  constructor(
    readonly servicoId: string,
    readonly precoCentavos: number
  ) {}
}
