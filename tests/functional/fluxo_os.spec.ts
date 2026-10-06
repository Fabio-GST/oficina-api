import { test } from '@japa/runner'
import { ADMIN, prepararBanco } from '#tests/helpers/banco'

/**
 * Teste funcional do fluxo principal: autenticação + ciclo completo de uma
 * Ordem de Serviço, ponta a ponta pela API. Usa o banco de teste configurado
 * em tests/bootstrap.ts (SQLite em memória).
 */
test.group('Fluxo de Ordem de Serviço', (group) => {
  prepararBanco(group, { comAdmin: true })

  test('autentica, cria OS, compõe orçamento, aprova e acompanha', async ({ client, assert }) => {
    // Login
    const login = await client.post('/auth/login').json(ADMIN)
    login.assertStatus(200)
    const token = login.body().token
    assert.exists(token)
    const auth = (req: any) => req.header('Authorization', `Bearer ${token}`)

    // Sem token → 401
    const semToken = await client.get('/customers')
    semToken.assertStatus(401)

    // Cliente
    const cliente = await auth(
      client.post('/customers').json({ nome: 'Maria', documento: '11144477735' })
    )
    cliente.assertStatus(201)
    const clienteId = cliente.body().id

    // Veículo
    const veiculo = await auth(
      client
        .post('/vehicles')
        .json({ clienteId, placa: 'ABC1D23', marca: 'Fiat', modelo: 'Uno', ano: 2020 })
    )
    veiculo.assertStatus(201)
    const veiculoId = veiculo.body().id

    // Serviço e peça
    const servico = await auth(client.post('/services').json({ nome: 'Troca de óleo', preco: 120 }))
    servico.assertStatus(201)
    const servicoId = servico.body().id

    const peca = await auth(
      client.post('/parts').json({ nome: 'Óleo 5W30', preco: 45, quantidadeEstoque: 10 })
    )
    peca.assertStatus(201)
    const pecaId = peca.body().id

    // Cria OS com serviço + peça
    const os = await auth(
      client.post('/work-orders').json({
        clienteId,
        veiculoId,
        servicos: [{ servicoId, quantidade: 1 }],
        pecas: [{ pecaId, quantidade: 2 }],
      })
    )
    os.assertStatus(201)
    const osId = os.body().id
    assert.equal(os.body().orcamento, 210) // 120 + 45*2
    assert.equal(os.body().status, 'RECEBIDA')

    // Estoque foi reduzido de 10 para 8
    const pecaAtual = await auth(client.get(`/parts/${pecaId}`))
    assert.equal(pecaAtual.body().quantidadeEstoque, 8)

    // Avança status até aguardando aprovação
    await auth(client.patch(`/work-orders/${osId}/status`).json({ status: 'EM_DIAGNOSTICO' }))
    await auth(client.patch(`/work-orders/${osId}/status`).json({ status: 'AGUARDANDO_APROVACAO' }))

    // Transição inválida → 422
    const invalida = await auth(
      client.patch(`/work-orders/${osId}/status`).json({ status: 'ENTREGUE' })
    )
    invalida.assertStatus(422)

    // Aprovação do cliente → EM_EXECUCAO
    const aprovacao = await auth(client.post(`/work-orders/${osId}/approval`))
    aprovacao.assertStatus(200)
    assert.equal(aprovacao.body().status, 'EM_EXECUCAO')

    // Finaliza e entrega
    await auth(client.patch(`/work-orders/${osId}/status`).json({ status: 'FINALIZADA' }))
    await auth(client.patch(`/work-orders/${osId}/status`).json({ status: 'ENTREGUE' }))

    // Acompanhamento público (sem token)
    const tracking = await client.get(`/work-orders/${osId}/tracking`)
    tracking.assertStatus(200)
    assert.equal(tracking.body().status, 'ENTREGUE')
    assert.equal(tracking.body().orcamento, 210)

    // Métrica de tempo médio
    const metrica = await auth(client.get('/metrics/average-execution-time'))
    metrica.assertStatus(200)
    assert.isAtLeast(metrica.body().ordensConsideradas, 1)
  })

  test('rejeita CPF inválido ao criar cliente', async ({ client }) => {
    const login = await client.post('/auth/login').json(ADMIN)
    const token = login.body().token
    const resposta = await client
      .post('/customers')
      .header('Authorization', `Bearer ${token}`)
      .json({ nome: 'Fulano', documento: '123' })
    resposta.assertStatus(422)
  })
})
