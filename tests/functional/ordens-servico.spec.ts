import { test } from '@japa/runner'
import { prepararBanco, logarComoAdmin } from '#tests/helpers/banco'
import { gerarCpf } from '#tests/helpers/dados'

test.group('HTTP Ordens de Serviço', (group) => {
  prepararBanco(group, { comAdmin: true })

  async function cenario(client: any, autenticar: any) {
    const cliente = await autenticar(
      client.post('/customers').json({ nome: 'Cli', documento: gerarCpf() })
    )
    const veiculo = await autenticar(
      client.post('/vehicles').json({
        clienteId: cliente.body().id,
        placa: 'ABC1D23',
        marca: 'Fiat',
        modelo: 'Uno',
        ano: 2020,
      })
    )
    const servico = await autenticar(
      client.post('/services').json({ nome: 'Troca de óleo', preco: 120 })
    )
    const peca = await autenticar(
      client.post('/parts').json({ nome: 'Óleo', preco: 45, quantidadeEstoque: 10 })
    )
    return {
      clienteId: cliente.body().id,
      veiculoId: veiculo.body().id,
      servicoId: servico.body().id,
      pecaId: peca.body().id,
    }
  }

  test('cria OS, adiciona serviço e peça e consulta', async ({ client, assert }) => {
    const { autenticar } = await logarComoAdmin(client)
    const c = await cenario(client, autenticar)

    const os = await autenticar(
      client.post('/work-orders').json({ clienteId: c.clienteId, veiculoId: c.veiculoId })
    )
    os.assertStatus(201)
    const id = os.body().id

    const comServico = await autenticar(
      client.post(`/work-orders/${id}/services`).json({ servicoId: c.servicoId, quantidade: 1 })
    )
    comServico.assertStatus(200)
    assert.equal(comServico.body().orcamento, 120)

    const comPeca = await autenticar(
      client.post(`/work-orders/${id}/parts`).json({ pecaId: c.pecaId, quantidade: 2 })
    )
    comPeca.assertStatus(200)
    assert.equal(comPeca.body().orcamento, 210)

    const show = await autenticar(client.get(`/work-orders/${id}`))
    show.assertStatus(200)

    const index = await autenticar(client.get('/work-orders'))
    index.assertStatus(200)
  })

  test('fluxo de recusa do orçamento', async ({ client, assert }) => {
    const { autenticar } = await logarComoAdmin(client)
    const c = await cenario(client, autenticar)
    const os = await autenticar(
      client.post('/work-orders').json({
        clienteId: c.clienteId,
        veiculoId: c.veiculoId,
        servicos: [{ servicoId: c.servicoId, quantidade: 1 }],
      })
    )
    const id = os.body().id

    await autenticar(client.post(`/work-orders/${id}/diagnosis`))
    await autenticar(client.post(`/work-orders/${id}/quote`))
    const recusa = await autenticar(client.post(`/work-orders/${id}/refusal`))
    recusa.assertStatus(200)
    assert.equal(recusa.body().status, 'RECUSADA')
  })

  test('fluxo de renegociação', async ({ client, assert }) => {
    const { autenticar } = await logarComoAdmin(client)
    const c = await cenario(client, autenticar)
    const os = await autenticar(
      client.post('/work-orders').json({
        clienteId: c.clienteId,
        veiculoId: c.veiculoId,
        servicos: [{ servicoId: c.servicoId, quantidade: 1 }],
      })
    )
    const id = os.body().id

    await autenticar(client.post(`/work-orders/${id}/diagnosis`))
    await autenticar(client.post(`/work-orders/${id}/quote`))
    const reneg = await autenticar(client.post(`/work-orders/${id}/renegotiation`))
    reneg.assertStatus(200)
    assert.equal(reneg.body().status, 'EM_DIAGNOSTICO')
  })

  test('ciclo de vida completo pelos endpoints dedicados', async ({ client, assert }) => {
    const { autenticar } = await logarComoAdmin(client)
    const c = await cenario(client, autenticar)
    const os = await autenticar(
      client.post('/work-orders').json({
        clienteId: c.clienteId,
        veiculoId: c.veiculoId,
        servicos: [{ servicoId: c.servicoId, quantidade: 1 }],
      })
    )
    const id = os.body().id

    await autenticar(client.post(`/work-orders/${id}/diagnosis`))
    await autenticar(client.post(`/work-orders/${id}/quote`))
    const aprovacao = await autenticar(client.post(`/work-orders/${id}/approval`))
    aprovacao.assertStatus(200)
    const finalizacao = await autenticar(client.post(`/work-orders/${id}/completion`))
    finalizacao.assertStatus(200)
    const entrega = await autenticar(client.post(`/work-orders/${id}/delivery`))
    entrega.assertStatus(200)
    assert.equal(entrega.body().status, 'ENTREGUE')
  })

  test('payload inválido retorna 422', async ({ client }) => {
    const { autenticar } = await logarComoAdmin(client)
    const r = await autenticar(client.post('/work-orders').json({ clienteId: 'nao-uuid' }))
    r.assertStatus(422)
  })

  test('OS inexistente retorna 404', async ({ client }) => {
    const { autenticar } = await logarComoAdmin(client)
    const r = await autenticar(client.get('/work-orders/11111111-1111-1111-1111-111111111111'))
    r.assertStatus(404)
  })

  test('acompanhamento público (tracking) não exige token', async ({ client, assert }) => {
    const { autenticar } = await logarComoAdmin(client)
    const c = await cenario(client, autenticar)
    const os = await autenticar(
      client.post('/work-orders').json({ clienteId: c.clienteId, veiculoId: c.veiculoId })
    )
    const tracking = await client.get(`/work-orders/${os.body().id}/tracking`)
    tracking.assertStatus(200)
    assert.equal(tracking.body().status, 'RECEBIDA')
  })
})
