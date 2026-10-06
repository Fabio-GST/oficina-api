import { test } from '@japa/runner'
import env from '#start/env'
import { prepararBanco, logarComoAdmin } from '#tests/helpers/banco'
import { gerarCpf } from '#tests/helpers/dados'

const TOKEN_VALIDO = env.get('WEBHOOK_SECRET')!

test.group('Webhook de decisão do orçamento', (group) => {
  prepararBanco(group, { comAdmin: true })

  /** Cria uma OS com um serviço e a leva até AGUARDANDO_APROVACAO. */
  async function osAguardandoAprovacao(client: any, autenticar: any) {
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
    const os = await autenticar(
      client.post('/work-orders').json({
        clienteId: cliente.body().id,
        veiculoId: veiculo.body().id,
        servicos: [{ servicoId: servico.body().id, quantidade: 1 }],
      })
    )
    const id = os.body().id
    await autenticar(client.post(`/work-orders/${id}/diagnosis`))
    await autenticar(client.post(`/work-orders/${id}/quote`))
    return id
  }

  test('aprova o orçamento via notificação externa', async ({ client, assert }) => {
    const { autenticar } = await logarComoAdmin(client)
    const id = await osAguardandoAprovacao(client, autenticar)

    const resposta = await client
      .post(`/work-orders/${id}/budget-decision`)
      .header('x-webhook-token', TOKEN_VALIDO)
      .json({ decisao: 'APROVADO' })

    resposta.assertStatus(200)
    assert.equal(resposta.body().status, 'EM_EXECUCAO')
  })

  test('recusa o orçamento via notificação externa', async ({ client, assert }) => {
    const { autenticar } = await logarComoAdmin(client)
    const id = await osAguardandoAprovacao(client, autenticar)

    const resposta = await client
      .post(`/work-orders/${id}/budget-decision`)
      .header('x-webhook-token', TOKEN_VALIDO)
      .json({ decisao: 'RECUSADO' })

    resposta.assertStatus(200)
    assert.equal(resposta.body().status, 'RECUSADA')
  })

  test('é idempotente: decisão repetida retorna o estado atual sem erro', async ({
    client,
    assert,
  }) => {
    const { autenticar } = await logarComoAdmin(client)
    const id = await osAguardandoAprovacao(client, autenticar)

    const primeira = await client
      .post(`/work-orders/${id}/budget-decision`)
      .header('x-webhook-token', TOKEN_VALIDO)
      .json({ decisao: 'APROVADO' })
    primeira.assertStatus(200)

    const reenvio = await client
      .post(`/work-orders/${id}/budget-decision`)
      .header('x-webhook-token', TOKEN_VALIDO)
      .json({ decisao: 'APROVADO' })

    reenvio.assertStatus(200)
    assert.equal(reenvio.body().status, 'EM_EXECUCAO')
  })

  test('rejeita chamada sem token ou com token inválido', async ({ client }) => {
    const { autenticar } = await logarComoAdmin(client)
    const id = await osAguardandoAprovacao(client, autenticar)

    const semToken = await client
      .post(`/work-orders/${id}/budget-decision`)
      .json({ decisao: 'APROVADO' })
    semToken.assertStatus(401)

    const tokenErrado = await client
      .post(`/work-orders/${id}/budget-decision`)
      .header('x-webhook-token', 'token-errado')
      .json({ decisao: 'APROVADO' })
    tokenErrado.assertStatus(401)
  })

  test('rejeita decisão para OS que não aguarda aprovação', async ({ client }) => {
    const { autenticar } = await logarComoAdmin(client)
    const cliente = await autenticar(
      client.post('/customers').json({ nome: 'Cli', documento: gerarCpf() })
    )
    const veiculo = await autenticar(
      client.post('/vehicles').json({
        clienteId: cliente.body().id,
        placa: 'XYZ4A21',
        marca: 'VW',
        modelo: 'Gol',
        ano: 2019,
      })
    )
    const os = await autenticar(
      client.post('/work-orders').json({
        clienteId: cliente.body().id,
        veiculoId: veiculo.body().id,
      })
    )

    const resposta = await client
      .post(`/work-orders/${os.body().id}/budget-decision`)
      .header('x-webhook-token', TOKEN_VALIDO)
      .json({ decisao: 'APROVADO' })

    resposta.assertStatus(422)
  })
})
