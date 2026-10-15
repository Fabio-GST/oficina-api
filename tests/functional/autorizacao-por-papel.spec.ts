import jwt from 'jsonwebtoken'
import { test } from '@japa/runner'
import env from '#start/env'
import { prepararBanco, logarComoAdmin } from '#tests/helpers/banco'

/** Token de cliente no formato emitido pela Function de autenticação por CPF. */
function tokenDeCliente() {
  return jwt.sign(
    { sub: 'cliente-1', cpf: '11144477735', papel: 'cliente' },
    env.get('JWT_SECRET'),
    {
      algorithm: 'HS256',
      expiresIn: '1h',
    }
  )
}

test.group('HTTP Autorização por papel', (group) => {
  prepararBanco(group, { comAdmin: true })

  test('token de cliente acessa /me e vê o próprio papel e cpf', async ({ client, assert }) => {
    const r = await client.get('/me').header('Authorization', `Bearer ${tokenDeCliente()}`)
    r.assertStatus(200)
    assert.equal(r.body().papel, 'cliente')
    assert.equal(r.body().cpf, '11144477735')
    assert.equal(r.body().id, 'cliente-1')
  })

  test('token de cliente em rota administrativa retorna 403', async ({ client, assert }) => {
    const r = await client.get('/customers').header('Authorization', `Bearer ${tokenDeCliente()}`)
    r.assertStatus(403)
    assert.equal(r.body().erro.codigo, 'ACESSO_NEGADO')
  })

  test('token de admin acessa rota administrativa e /me informa papel admin', async ({
    client,
    assert,
  }) => {
    const { autenticar } = await logarComoAdmin(client)
    const lista = await autenticar(client.get('/customers'))
    lista.assertStatus(200)

    const me = await autenticar(client.get('/me'))
    me.assertStatus(200)
    assert.equal(me.body().papel, 'admin')
  })

  test('token sem papel é recusado com 401', async ({ client }) => {
    const token = jwt.sign({ sub: 'x' }, env.get('JWT_SECRET'), { algorithm: 'HS256' })
    const r = await client.get('/me').header('Authorization', `Bearer ${token}`)
    r.assertStatus(401)
  })
})
