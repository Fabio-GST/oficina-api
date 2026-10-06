import { test } from '@japa/runner'
import { ADMIN, prepararBanco, logarComoAdmin } from '#tests/helpers/banco'

test.group('HTTP Autenticação', (group) => {
  prepararBanco(group, { comAdmin: true })

  test('login com credenciais válidas retorna token', async ({ client, assert }) => {
    const r = await client.post('/auth/login').json(ADMIN)
    r.assertStatus(200)
    assert.exists(r.body().token)
  })

  test('login com senha errada retorna 401', async ({ client }) => {
    const r = await client.post('/auth/login').json({ email: ADMIN.email, senha: 'errada123' })
    r.assertStatus(401)
  })

  test('login com payload inválido retorna 422', async ({ client }) => {
    const r = await client.post('/auth/login').json({ email: 'nao-eh-email' })
    r.assertStatus(422)
  })

  test('/me sem token retorna 401', async ({ client }) => {
    const r = await client.get('/me')
    r.assertStatus(401)
  })

  test('registra novo administrador e acessa /me', async ({ client, assert }) => {
    const { autenticar } = await logarComoAdmin(client)
    const novo = await autenticar(
      client
        .post('/auth/register')
        .json({ nome: 'João', email: 'joao@oficina.test', senha: 'senhaSegura1' })
    )
    novo.assertStatus(201)

    const login = await client
      .post('/auth/login')
      .json({ email: 'joao@oficina.test', senha: 'senhaSegura1' })
    login.assertStatus(200)

    const me = await client.get('/me').header('Authorization', `Bearer ${login.body().token}`)
    me.assertStatus(200)
    assert.equal(me.body().email, 'joao@oficina.test')
  })

  test('registrar e-mail duplicado retorna 409', async ({ client }) => {
    const { autenticar } = await logarComoAdmin(client)
    const r = await autenticar(
      client
        .post('/auth/register')
        .json({ nome: 'Admin', email: ADMIN.email, senha: 'senhaSegura1' })
    )
    r.assertStatus(409)
  })
})
