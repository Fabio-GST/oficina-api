import { randomUUID } from 'node:crypto'
import type { Group } from '@japa/runner/core'
import type { ApiClient } from '@japa/api-client'
import testUtils from '@adonisjs/core/services/test_utils'
import { servicoDeHash } from '#shared/frameworks-drivers/hash/servico-de-hash-adonis'
import UsuarioModel from '#modulos/autenticacao/frameworks-drivers/models/usuario_model'

/** Credenciais do admin semeado nos testes que precisam de autenticação. */
export const ADMIN = { email: 'admin@oficina.test', senha: 'admin12345' }

/**
 * Insere o usuário administrativo padrão. Chame em `group.setup` (fora da
 * transação por teste) para que persista entre os testes do grupo.
 */
export async function semearAdmin() {
  await UsuarioModel.create({
    id: randomUUID(),
    nome: 'Admin de Teste',
    email: ADMIN.email,
    senhaHash: await servicoDeHash.gerar(ADMIN.senha),
  })
}

/** Autentica como admin e devolve o token e um aplicador de header `Authorization`. */
export async function logarComoAdmin(client: ApiClient) {
  const resposta = await client.post('/auth/login').json(ADMIN)
  const token = resposta.body().token as string
  const autenticar = (req: ReturnType<ApiClient['get']>) =>
    req.header('Authorization', `Bearer ${token}`)
  return { token, autenticar }
}

/**
 * Liga o ciclo de vida do banco a um grupo de testes:
 *  - cada teste roda numa transação global que sofre rollback ao final (isolamento);
 *  - opcionalmente semeia o admin uma vez, antes da transação (persiste no grupo).
 *
 * As migrations já são aplicadas uma vez por suíte (ver `tests/bootstrap.ts`).
 */
export function prepararBanco(group: Group, opts: { comAdmin?: boolean } = {}) {
  // A transação global deve abrir ANTES do seed, para que o admin semeado seja
  // isolado (rollback) por teste — evitando que persista/colida entre grupos.
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  if (opts.comAdmin) {
    group.each.setup(() => semearAdmin())
  }
}
