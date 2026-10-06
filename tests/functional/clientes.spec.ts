import { test } from '@japa/runner'
import { prepararBanco, logarComoAdmin } from '#tests/helpers/banco'
import { gerarCpf } from '#tests/helpers/dados'

test.group('HTTP Clientes', (group) => {
  prepararBanco(group, { comAdmin: true })

  test('exige autenticação', async ({ client }) => {
    const r = await client.get('/customers')
    r.assertStatus(401)
  })

  test('cria, consulta, atualiza, busca por documento e remove', async ({ client, assert }) => {
    const { autenticar } = await logarComoAdmin(client)
    const documento = gerarCpf()

    const criado = await autenticar(client.post('/customers').json({ nome: 'Maria', documento }))
    criado.assertStatus(201)
    const id = criado.body().id

    const show = await autenticar(client.get(`/customers/${id}`))
    show.assertStatus(200)
    assert.equal(show.body().nome, 'Maria')

    const index = await autenticar(client.get('/customers'))
    index.assertStatus(200)
    assert.isArray(index.body())

    const atualizado = await autenticar(
      client.put(`/customers/${id}`).json({ nome: 'Maria Silva' })
    )
    atualizado.assertStatus(200)
    assert.equal(atualizado.body().nome, 'Maria Silva')

    const porDoc = await autenticar(client.get(`/customers/by-document/${documento}`))
    porDoc.assertStatus(200)

    const removido = await autenticar(client.delete(`/customers/${id}`))
    removido.assertStatus(204)
  })

  test('rejeita payload inválido com 422', async ({ client }) => {
    const { autenticar } = await logarComoAdmin(client)
    const r = await autenticar(client.post('/customers').json({ nome: 'x', documento: '123' }))
    r.assertStatus(422)
  })

  test('rejeita documento duplicado com 409', async ({ client }) => {
    const { autenticar } = await logarComoAdmin(client)
    const documento = gerarCpf()
    await autenticar(client.post('/customers').json({ nome: 'Ana', documento }))
    const r = await autenticar(client.post('/customers').json({ nome: 'Bia', documento }))
    r.assertStatus(409)
  })

  test('retorna 404 para id e documento inexistentes', async ({ client }) => {
    const { autenticar } = await logarComoAdmin(client)
    const show = await autenticar(client.get('/customers/inexistente'))
    show.assertStatus(404)
    const porDoc = await autenticar(client.get(`/customers/by-document/${gerarCpf()}`))
    porDoc.assertStatus(404)
  })
})
