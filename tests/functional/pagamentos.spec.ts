import { test } from '@japa/runner'
import { prepararBanco, logarComoAdmin } from '#tests/helpers/banco'
import { gerarCpf } from '#tests/helpers/dados'

test.group('HTTP Pagamentos', (group) => {
  prepararBanco(group, { comAdmin: true })

  async function novaOrdem(client: any, autenticar: any) {
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
    const os = await autenticar(
      client
        .post('/work-orders')
        .json({ clienteId: cliente.body().id, veiculoId: veiculo.body().id })
    )
    return os.body().id
  }

  test('gera cobrança, aplica desconto, registra pagamento e emite nota', async ({
    client,
    assert,
  }) => {
    const { autenticar } = await logarComoAdmin(client)
    const osId = await novaOrdem(client, autenticar)

    const cobranca = await autenticar(
      client.post(`/work-orders/${osId}/charge`).json({ total: 200 })
    )
    cobranca.assertStatus(201)
    const id = cobranca.body().id

    const obtido = await autenticar(client.get(`/payments/${id}`))
    obtido.assertStatus(200)

    const desconto = await autenticar(
      client.post(`/payments/${id}/discount`).json({ desconto: 20 })
    )
    desconto.assertStatus(200)
    assert.equal(desconto.body().valorDevido, 180)

    const pago = await autenticar(client.post(`/payments/${id}/payment`).json({ valor: 180 }))
    pago.assertStatus(200)
    assert.equal(pago.body().status, 'QUITADO')

    const nota = await autenticar(client.post(`/payments/${id}/invoice`))
    nota.assertStatus(200)
    assert.exists(nota.body().notaFiscalNumero)
  })

  test('emitir nota antes da quitação retorna 422', async ({ client }) => {
    const { autenticar } = await logarComoAdmin(client)
    const osId = await novaOrdem(client, autenticar)
    const cobranca = await autenticar(
      client.post(`/work-orders/${osId}/charge`).json({ total: 100 })
    )
    const r = await autenticar(client.post(`/payments/${cobranca.body().id}/invoice`))
    r.assertStatus(422)
  })

  test('cobrança com total inválido retorna 422', async ({ client }) => {
    const { autenticar } = await logarComoAdmin(client)
    const osId = await novaOrdem(client, autenticar)
    const r = await autenticar(client.post(`/work-orders/${osId}/charge`).json({ total: 0 }))
    r.assertStatus(422)
  })

  test('pagamento inexistente retorna 404', async ({ client }) => {
    const { autenticar } = await logarComoAdmin(client)
    const r = await autenticar(client.get('/payments/inexistente'))
    r.assertStatus(404)
  })
})
