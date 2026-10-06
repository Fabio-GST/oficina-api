import { randomUUID } from 'node:crypto'
import { test } from '@japa/runner'
import { prepararBanco, logarComoAdmin } from '#tests/helpers/banco'
import { gerarCpf } from '#tests/helpers/dados'

test.group('HTTP Veículos', (group) => {
  prepararBanco(group, { comAdmin: true })

  test('exige autenticação', async ({ client }) => {
    const r = await client.get('/vehicles')
    r.assertStatus(401)
  })

  test('cria, consulta, atualiza, vincula, busca por placa e remove', async ({
    client,
    assert,
  }) => {
    const { autenticar } = await logarComoAdmin(client)
    const cliente = await autenticar(
      client.post('/customers').json({ nome: 'Dono', documento: gerarCpf() })
    )
    const clienteId = cliente.body().id

    const criado = await autenticar(
      client
        .post('/vehicles')
        .json({ clienteId, placa: 'ABC1D23', marca: 'Fiat', modelo: 'Uno', ano: 2020 })
    )
    criado.assertStatus(201)
    const id = criado.body().id

    const show = await autenticar(client.get(`/vehicles/${id}`))
    show.assertStatus(200)
    assert.equal(show.body().modelo, 'Uno')

    const index = await autenticar(client.get('/vehicles').qs({ clienteId }))
    index.assertStatus(200)
    assert.lengthOf(index.body(), 1)

    const atualizado = await autenticar(client.put(`/vehicles/${id}`).json({ modelo: 'Uno Way' }))
    atualizado.assertStatus(200)
    assert.equal(atualizado.body().modelo, 'Uno Way')

    const novoDono = await autenticar(
      client.post('/customers').json({ nome: 'Novo Dono', documento: gerarCpf() })
    )
    const vinculo = await autenticar(
      client.patch(`/vehicles/${id}/owner`).json({ clienteId: novoDono.body().id })
    )
    vinculo.assertStatus(200)
    assert.equal(vinculo.body().clienteId, novoDono.body().id)

    const porPlaca = await autenticar(client.get('/vehicles/by-plate/ABC1D23'))
    porPlaca.assertStatus(200)

    const removido = await autenticar(client.delete(`/vehicles/${id}`))
    removido.assertStatus(204)
  })

  test('rejeita payload inválido com 422', async ({ client }) => {
    const { autenticar } = await logarComoAdmin(client)
    const r = await autenticar(client.post('/vehicles').json({ placa: 'x' }))
    r.assertStatus(422)
  })

  test('cria para cliente inexistente retorna 404', async ({ client }) => {
    const { autenticar } = await logarComoAdmin(client)
    const r = await autenticar(
      client.post('/vehicles').json({
        clienteId: randomUUID(),
        placa: 'ABC1D23',
        marca: 'Fiat',
        modelo: 'Uno',
        ano: 2020,
      })
    )
    r.assertStatus(404)
  })

  test('placa não encontrada retorna 404', async ({ client }) => {
    const { autenticar } = await logarComoAdmin(client)
    const r = await autenticar(client.get('/vehicles/by-plate/ZZZ9Z99'))
    r.assertStatus(404)
  })
})
