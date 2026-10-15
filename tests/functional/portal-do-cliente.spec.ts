import jwt from 'jsonwebtoken'
import { test } from '@japa/runner'
import env from '#start/env'
import { prepararBanco, logarComoAdmin } from '#tests/helpers/banco'
import { gerarCpf } from '#tests/helpers/dados'

/** Token no formato emitido pela Function de autenticação por CPF (repo oficina-auth-lambda). */
function tokenDeCliente(cliente: { id: string; cpf: string }) {
  return jwt.sign({ sub: cliente.id, cpf: cliente.cpf, papel: 'cliente' }, env.get('JWT_SECRET'), {
    algorithm: 'HS256',
    expiresIn: '1h',
  })
}

/**
 * Cria, como admin, um cliente com veículo e uma OS levada até
 * AGUARDANDO_APROVACAO. Devolve o token de cliente correspondente.
 */
async function cenario(client: any, autenticar: any) {
  const cpf = gerarCpf()
  const cliente = await autenticar(
    client.post('/customers').json({ nome: 'Maria', documento: cpf })
  )
  const clienteId = cliente.body().id as string

  const veiculo = await autenticar(
    client.post('/vehicles').json({
      clienteId,
      placa: `ABC${Math.floor(Math.random() * 9)}D${Math.floor(Math.random() * 90 + 10)}`,
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
      clienteId,
      veiculoId: veiculo.body().id,
      servicos: [{ servicoId: servico.body().id, quantidade: 1 }],
    })
  )
  const osId = os.body().id as string
  await autenticar(client.post(`/work-orders/${osId}/diagnosis`))
  await autenticar(client.post(`/work-orders/${osId}/quote`))

  return {
    clienteId,
    cpf,
    osId,
    veiculoId: veiculo.body().id as string,
    token: tokenDeCliente({ id: clienteId, cpf }),
  }
}

test.group('HTTP Portal do cliente (JWT por CPF)', (group) => {
  prepararBanco(group, { comAdmin: true })

  test('cliente lista seus veículos e suas OS, mas não as de outro cliente', async ({
    client,
    assert,
  }) => {
    const { autenticar } = await logarComoAdmin(client)
    const a = await cenario(client, autenticar)
    const b = await cenario(client, autenticar)

    const veiculos = await client.get('/me/vehicles').header('Authorization', `Bearer ${a.token}`)
    veiculos.assertStatus(200)
    assert.lengthOf(veiculos.body(), 1)
    assert.equal(veiculos.body()[0].id, a.veiculoId)

    const ordens = await client.get('/me/work-orders').header('Authorization', `Bearer ${a.token}`)
    ordens.assertStatus(200)
    assert.lengthOf(ordens.body(), 1)
    assert.equal(ordens.body()[0].id, a.osId)
    assert.equal(ordens.body()[0].status, 'AGUARDANDO_APROVACAO')

    const detalhe = await client
      .get(`/me/work-orders/${a.osId}`)
      .header('Authorization', `Bearer ${a.token}`)
    detalhe.assertStatus(200)
    assert.equal(detalhe.body().orcamento, 120)

    // OS do cliente B vista pelo cliente A → 404 (não revela existência)
    const alheia = await client
      .get(`/me/work-orders/${b.osId}`)
      .header('Authorization', `Bearer ${a.token}`)
    alheia.assertStatus(404)
    assert.equal(alheia.body().erro.codigo, 'RECURSO_NAO_ENCONTRADO')
  })

  test('cliente aprova o orçamento da própria OS', async ({ client, assert }) => {
    const { autenticar } = await logarComoAdmin(client)
    const a = await cenario(client, autenticar)

    const aprovacao = await client
      .post(`/me/work-orders/${a.osId}/approval`)
      .header('Authorization', `Bearer ${a.token}`)
    aprovacao.assertStatus(200)
    assert.equal(aprovacao.body().status, 'EM_EXECUCAO')

    // Segunda aprovação viola a máquina de estados
    const repetida = await client
      .post(`/me/work-orders/${a.osId}/approval`)
      .header('Authorization', `Bearer ${a.token}`)
    repetida.assertStatus(422)
  })

  test('cliente recusa o orçamento da própria OS e não decide sobre OS alheia', async ({
    client,
    assert,
  }) => {
    const { autenticar } = await logarComoAdmin(client)
    const a = await cenario(client, autenticar)
    const b = await cenario(client, autenticar)

    const alheia = await client
      .post(`/me/work-orders/${b.osId}/refusal`)
      .header('Authorization', `Bearer ${a.token}`)
    alheia.assertStatus(404)

    const recusa = await client
      .post(`/me/work-orders/${a.osId}/refusal`)
      .header('Authorization', `Bearer ${a.token}`)
    recusa.assertStatus(200)
    assert.equal(recusa.body().status, 'RECUSADA')

    // A OS de B continua aguardando aprovação
    const deB = await client
      .get(`/me/work-orders/${b.osId}`)
      .header('Authorization', `Bearer ${b.token}`)
    assert.equal(deB.body().status, 'AGUARDANDO_APROVACAO')
  })

  test('token de admin não acessa o portal do cliente (403) e sem token é 401', async ({
    client,
    assert,
  }) => {
    const { autenticar } = await logarComoAdmin(client)

    const comoAdmin = await autenticar(client.get('/me/work-orders'))
    comoAdmin.assertStatus(403)
    assert.equal(comoAdmin.body().erro.codigo, 'ACESSO_NEGADO')

    const semToken = await client.get('/me/work-orders')
    semToken.assertStatus(401)
  })
})
