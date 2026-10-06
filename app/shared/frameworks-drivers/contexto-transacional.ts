import { AsyncLocalStorage } from 'node:async_hooks'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'

/**
 * Armazena a transação ativa para o fluxo assíncrono atual, permitindo que os
 * repositórios participem de uma transação sem que a camada de domínio precise
 * conhecer o Lucid.
 */
export const contextoTransacional = new AsyncLocalStorage<TransactionClientContract>()

export function transacaoAtual(): TransactionClientContract | undefined {
  return contextoTransacional.getStore()
}

/**
 * Opções de cliente para queries Lucid: usa a transação ativa quando existir.
 */
export function opcoesDeCliente(): { client?: TransactionClientContract } {
  const trx = transacaoAtual()
  return trx ? { client: trx } : {}
}
