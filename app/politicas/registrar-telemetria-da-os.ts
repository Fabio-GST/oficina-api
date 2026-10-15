import type { EventoDeDominio } from '#shared/entities/evento-de-dominio'
import type { ManipuladorDeEvento } from '#shared/use-cases/manipulador-de-evento'
import type { Telemetria } from '#shared/use-cases/telemetria'
import type { OrdemServicoAberta } from '#modulos/ordens-servico/entities/eventos/ordem-servico-aberta'
import type { OrdemServicoDTO } from '#modulos/ordens-servico/use-cases/dtos'

type ObterOrdem = (ordemId: string) => Promise<OrdemServicoDTO>

interface EventoComOrdem extends EventoDeDominio {
  ordemServicoId: string
}

/**
 * Política de observabilidade: ao abrir uma OS, registra o evento
 * `OrdemServicoCriada` — base do painel "volume diário de OS" (RFC 0004).
 */
export class RegistrarCriacaoDaOS implements ManipuladorDeEvento<OrdemServicoAberta> {
  readonly evento = 'ordem-servico.aberta'

  constructor(private readonly telemetria: Telemetria) {}

  async manipular(evento: OrdemServicoAberta): Promise<void> {
    this.telemetria.registrarEvento('OrdemServicoCriada', {
      ordemServicoId: evento.ordemServicoId,
      clienteId: evento.clienteId,
      veiculoId: evento.veiculoId,
    })
  }
}

/**
 * Política de observabilidade: a cada transição de status da OS registra
 * `OrdemServicoMudouStatus { de, para, duracaoMs }`, derivado dos dois últimos
 * registros do histórico (`historico_status_os`). `duracaoMs` é o tempo que a
 * OS passou no status `de` — base do painel "tempo médio por status".
 *
 * Inscreve-se em um evento de transição por instância (ver `start/eventos.ts`).
 */
export class RegistrarMudancaDeStatusDaOS implements ManipuladorDeEvento<EventoComOrdem> {
  constructor(
    readonly evento: string,
    private readonly obterOrdem: ObterOrdem,
    private readonly telemetria: Telemetria
  ) {}

  async manipular(evento: EventoComOrdem): Promise<void> {
    const ordem = await this.obterOrdem(evento.ordemServicoId)
    const historico = ordem.historico
    if (historico.length < 2) return

    const anterior = historico[historico.length - 2]
    const atual = historico[historico.length - 1]
    const duracaoMs = Math.max(0, Date.parse(atual.ocorridoEm) - Date.parse(anterior.ocorridoEm))

    this.telemetria.registrarEvento('OrdemServicoMudouStatus', {
      ordemServicoId: ordem.id,
      de: anterior.status,
      para: atual.status,
      duracaoMs: Number.isFinite(duracaoMs) ? duracaoMs : 0,
    })
  }
}
