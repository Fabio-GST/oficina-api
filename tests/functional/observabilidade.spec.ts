import { test } from '@japa/runner'
import { prepararBanco } from '#tests/helpers/banco'

test.group('HTTP Correlação de requisições', () => {
  test('devolve o x-request-id recebido (ex.: do API Gateway)', async ({ client, assert }) => {
    const r = await client.get('/health').header('x-request-id', 'gw-abc-123')
    r.assertStatus(200)
    assert.equal(r.header('x-request-id'), 'gw-abc-123')
  })

  test('gera um x-request-id quando o cliente não envia', async ({ client, assert }) => {
    const r = await client.get('/health')
    r.assertStatus(200)
    const id = r.header('x-request-id')
    assert.isString(id)
    assert.isAbove((id as string).length, 8)
  })

  test('devolve o x-request-id também em respostas de erro', async ({ client, assert }) => {
    const r = await client.get('/customers').header('x-request-id', 'gw-erro-1')
    r.assertStatus(401)
    assert.equal(r.header('x-request-id'), 'gw-erro-1')
  })
})

test.group('HTTP Healthcheck', (group) => {
  prepararBanco(group)

  test('liveness responde ok sem consultar o banco', async ({ client, assert }) => {
    const r = await client.get('/health')
    r.assertStatus(200)
    assert.deepEqual(r.body(), { status: 'ok' })
  })

  test('readiness consulta o banco e responde ok', async ({ client, assert }) => {
    const r = await client.get('/health/ready')
    r.assertStatus(200)
    assert.deepEqual(r.body(), { status: 'ok', banco: 'ok' })
  })
})
