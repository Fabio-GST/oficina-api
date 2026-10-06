import { test } from '@japa/runner'
import { prepararBanco, logarComoAdmin } from '#tests/helpers/banco'

test.group('HTTP Serviços', (group) => {
  prepararBanco(group, { comAdmin: true })

  test('exige autenticação', async ({ client }) => {
    const r = await client.get('/services')
    r.assertStatus(401)
  })

  test('cria, consulta, atualiza, tempo, inativa/reativa e remove', async ({ client, assert }) => {
    const { autenticar } = await logarComoAdmin(client)

    const criado = await autenticar(
      client.post('/services').json({ nome: 'Troca de óleo', preco: 120 })
    )
    criado.assertStatus(201)
    const id = criado.body().id

    const show = await autenticar(client.get(`/services/${id}`))
    show.assertStatus(200)

    const index = await autenticar(client.get('/services'))
    index.assertStatus(200)

    const atualizado = await autenticar(client.put(`/services/${id}`).json({ preco: 150 }))
    atualizado.assertStatus(200)
    assert.equal(atualizado.body().preco, 150)

    const tempo = await autenticar(
      client.patch(`/services/${id}/estimated-time`).json({ tempoEstimadoMinutos: 40 })
    )
    tempo.assertStatus(200)
    assert.equal(tempo.body().tempoEstimadoMinutos, 40)

    const inativado = await autenticar(client.patch(`/services/${id}/deactivate`))
    inativado.assertStatus(200)
    assert.isFalse(inativado.body().ativo)

    const reativado = await autenticar(client.patch(`/services/${id}/activate`))
    reativado.assertStatus(200)
    assert.isTrue(reativado.body().ativo)

    const removido = await autenticar(client.delete(`/services/${id}`))
    removido.assertStatus(204)
  })

  test('rejeita payload inválido com 422', async ({ client }) => {
    const { autenticar } = await logarComoAdmin(client)
    const r = await autenticar(client.post('/services').json({ nome: 'x' }))
    r.assertStatus(422)
  })

  test('atualizar serviço inativo retorna 422 (regra de negócio)', async ({ client }) => {
    const { autenticar } = await logarComoAdmin(client)
    const criado = await autenticar(client.post('/services').json({ nome: 'Revisão', preco: 200 }))
    const id = criado.body().id
    await autenticar(client.patch(`/services/${id}/deactivate`))
    const r = await autenticar(client.put(`/services/${id}`).json({ preco: 300 }))
    r.assertStatus(422)
  })

  test('serviço inexistente retorna 404', async ({ client }) => {
    const { autenticar } = await logarComoAdmin(client)
    const r = await autenticar(client.get('/services/inexistente'))
    r.assertStatus(404)
  })
})
