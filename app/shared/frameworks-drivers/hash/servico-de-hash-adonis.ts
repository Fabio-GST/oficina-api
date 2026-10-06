import hash from '@adonisjs/core/services/hash'
import type { ServicoDeHash } from '#shared/use-cases/servico-de-hash'

/**
 * Implementação de {@link ServicoDeHash} sobre o serviço de hash do AdonisJS
 * (scrypt por padrão, configurável em `config/hash.ts`).
 */
export class ServicoDeHashAdonis implements ServicoDeHash {
  gerar(textoPuro: string): Promise<string> {
    return hash.make(textoPuro)
  }

  verificar(textoPuro: string, valorHash: string): Promise<boolean> {
    return hash.verify(valorHash, textoPuro)
  }
}

export const servicoDeHash = new ServicoDeHashAdonis()
