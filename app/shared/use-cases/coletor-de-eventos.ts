import { AsyncLocalStorage } from 'node:async_hooks'
import type { EventoDeDominio } from '#shared/entities/evento-de-dominio'
import type { RaizAgregado } from '#shared/entities/raiz-agregado'
import type { DespachanteDeEventos } from './despachante-de-eventos.js'

/**
 * Buffer de eventos do fluxo assíncrono atual. Quando há um buffer ativo (dentro
 * de uma Unidade de Trabalho), os eventos são acumulados para publicação somente
 * **após o commit**; fora dele, são publicados imediatamente.
 */
const escopo = new AsyncLocalStorage<EventoDeDominio[]>()

/**
 * Despachante configurado pelo composition root (infraestrutura). A camada de
 * aplicação depende apenas da interface {@link DespachanteDeEventos}; a
 * implementação concreta (barramento em memória, fila etc.) se registra aqui no
 * boot. Sem despachante configurado, os eventos são descartados — situação
 * normal em testes unitários que não exercitam Políticas.
 */
let despachante: DespachanteDeEventos | undefined

export function configurarDespachanteDeEventos(novo: DespachanteDeEventos): void {
  despachante = novo
}

async function publicar(eventos: EventoDeDominio[]): Promise<void> {
  if (despachante) {
    await despachante.publicar(eventos)
  }
}

/**
 * Extrai os eventos acumulados no agregado e os encaminha para publicação:
 * acumula no buffer da transação ativa, ou publica na hora se não houver uma.
 *
 * Deve ser chamado pelos casos de uso logo após `repositorio.salvar(agregado)`.
 */
export async function coletarEventosDe(agregado: RaizAgregado): Promise<void> {
  await publicarEventos(agregado.extrairEventos())
}

/**
 * Publica eventos avulsos (fora de um agregado), respeitando o mesmo buffer
 * transacional. Útil para eventos de consulta, que não pertencem a uma raiz.
 */
export async function publicarEventos(eventos: EventoDeDominio[]): Promise<void> {
  if (eventos.length === 0) return

  const buffer = escopo.getStore()
  if (buffer) {
    buffer.push(...eventos)
  } else {
    await publicar(eventos)
  }
}

/**
 * Executa `operacao` acumulando os eventos coletados durante ela e os publica
 * apenas depois que a operação conclui com sucesso (após o commit). Usado pela
 * Unidade de Trabalho para garantir que nenhum evento vaze antes da persistência.
 */
export async function publicarAposCommit<T>(operacao: () => Promise<T>): Promise<T> {
  const buffer: EventoDeDominio[] = []
  const resultado = await escopo.run(buffer, operacao)
  if (buffer.length > 0) {
    await publicar(buffer)
  }
  return resultado
}
