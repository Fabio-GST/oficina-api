import { test } from '@japa/runner'
import { prepararBanco, logarComoAdmin } from '#tests/helpers/banco'

test.group('HTTP Estoque (Peças)', (group) => {
  prepararBanco(group, { comAdmin: true })

  test('exige autenticação', async ({ client }) => {
    const r = await client.get('/parts')
    r.assertStatus(401)
  })

  test('cria, consulta, atualiza, ajusta, reserva, utiliza, mínimo e remove', async ({
    client,
    assert,
  }) => {
    const { autenticar } = await logarComoAdmin(client)

    const criado = await autenticar(
      client.post('/parts').json({ nome: 'Óleo 5W30', preco: 45, quantidadeEstoque: 10 })
    )
    criado.assertStatus(201)
    const id = criado.body().id

    const show = await autenticar(client.get(`/parts/${id}`))
    show.assertStatus(200)

    const index = await autenticar(client.get('/parts'))
    index.assertStatus(200)

    const atualizado = await autenticar(client.put(`/parts/${id}`).json({ preco: 50 }))
    atualizado.assertStatus(200)
    assert.equal(atualizado.body().preco, 50)

    const ajustado = await autenticar(client.patch(`/parts/${id}/stock`).json({ quantidade: 20 }))
    ajustado.assertStatus(200)
    assert.equal(ajustado.body().quantidadeEstoque, 20)

    const reservado = await autenticar(
      client.post(`/parts/${id}/reservations`).json({ quantidade: 5 })
    )
    reservado.assertStatus(200)
    assert.equal(reservado.body().quantidadeReservada, 5)

    const utilizado = await autenticar(client.post(`/parts/${id}/usage`).json({ quantidade: 5 }))
    utilizado.assertStatus(200)
    assert.equal(utilizado.body().quantidadeReservada, 0)

    const minimo = await autenticar(
      client.patch(`/parts/${id}/minimum-stock`).json({ estoqueMinimo: 3 })
    )
    minimo.assertStatus(200)
    assert.equal(minimo.body().estoqueMinimo, 3)

    const removido = await autenticar(client.delete(`/parts/${id}`))
    removido.assertStatus(204)
  })

  test('fluxo de compra: solicita e recebe (repõe estoque)', async ({ client, assert }) => {
    const { autenticar } = await logarComoAdmin(client)
    const criado = await autenticar(
      client.post('/parts').json({ nome: 'Correia', preco: 80, quantidadeEstoque: 1 })
    )
    const id = criado.body().id

    const solicitacao = await autenticar(
      client.post(`/parts/${id}/purchase-orders`).json({ quantidade: 10 })
    )
    solicitacao.assertStatus(201)

    const recebida = await autenticar(
      client.post(`/purchase-orders/${solicitacao.body().id}/receive`)
    )
    recebida.assertStatus(200)

    const peca = await autenticar(client.get(`/parts/${id}`))
    assert.equal(peca.body().quantidadeEstoque, 11)
  })

  test('rejeita payload inválido com 422', async ({ client }) => {
    const { autenticar } = await logarComoAdmin(client)
    const r = await autenticar(client.post('/parts').json({ nome: 'x' }))
    r.assertStatus(422)
  })

  test('peça inexistente retorna 404', async ({ client }) => {
    const { autenticar } = await logarComoAdmin(client)
    const r = await autenticar(client.get('/parts/inexistente'))
    r.assertStatus(404)
  })
})
