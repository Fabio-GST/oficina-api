import logger from '@adonisjs/core/services/logger'
import type { EventoDeDominio } from '#shared/entities/evento-de-dominio'
import type { DespachanteDeEventos } from '#shared/use-cases/despachante-de-eventos'
import type { ManipuladorDeEvento } from '#shared/use-cases/manipulador-de-evento'
import { configurarDespachanteDeEventos } from '#shared/use-cases/coletor-de-eventos'

/**
 * Barramento de Eventos de Domínio em memória (in-process).
 *
 * Entrega cada evento aos manipuladores inscritos no seu `nome`. As falhas de um
 * manipulador são isoladas e registradas — uma Política que falha não derruba as
 * demais nem o fluxo que originou o evento (que já foi persistido). Para evolução
 * futura (entrega garantida, retentativas), trocar por um adaptador de fila que
 * implemente a mesma interface {@link DespachanteDeEventos}.
 */
export class BarramentoDeEventos implements DespachanteDeEventos {
  private readonly manipuladores = new Map<string, ManipuladorDeEvento[]>()

  /** Inscreve um manipulador no evento indicado por `manipulador.evento`. */
  registrar(manipulador: ManipuladorDeEvento): void {
    const lista = this.manipuladores.get(manipulador.evento) ?? []
    lista.push(manipulador)
    this.manipuladores.set(manipulador.evento, lista)
  }

  /** Remove todos os manipuladores (útil em testes). */
  limpar(): void {
    this.manipuladores.clear()
  }

  async publicar(eventos: EventoDeDominio[]): Promise<void> {
    for (const evento of eventos) {
      const lista = this.manipuladores.get(evento.nome) ?? []
      for (const manipulador of lista) {
        try {
          await manipulador.manipular(evento)
        } catch (erro) {
          // Política isolada: registra e segue. O evento de origem já foi gravado.
          logger.error(
            { err: erro },
            `[eventos] Falha ao manipular "${evento.nome}" em ${manipulador.constructor.name}`
          )
        }
      }
    }
  }
}

/**
 * Instância única do barramento (composition root de eventos). É aqui que os
 * manipuladores são registrados no boot (ver `start/eventos.ts`). Ao carregar,
 * o barramento se pluga como despachante do coletor de eventos da camada de
 * aplicação — a aplicação segue conhecendo apenas a interface.
 */
export const barramentoDeEventos = new BarramentoDeEventos()
configurarDespachanteDeEventos(barramentoDeEventos)
