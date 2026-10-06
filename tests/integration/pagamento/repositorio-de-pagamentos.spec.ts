import { randomUUID } from 'node:crypto'
import { test } from '@japa/runner'
import { prepararBanco } from '#tests/helpers/banco'
import { Dinheiro } from '#shared/entities/objetos-de-valor/dinheiro'
import { Pagamento, StatusPagamento } from '#modulos/pagamento/entities/pagamento'
import { RepositorioDePagamentosLucid } from '#modulos/pagamento/interface-adapters/gateways/repositorio-de-pagamentos-lucid'

test.group('RepositorioDePagamentosLucid', (group) => {
  prepararBanco(group)
  const repositorio = new RepositorioDePagamentosLucid()

  function novaCobranca(ordemId = randomUUID(), reais = 200) {
    return Pagamento.gerarCobranca({ ordemId, total: Dinheiro.deReais(reais) })
  }

  test('salva e recupera uma cobrança pendente', async ({ assert }) => {
    const pagamento = novaCobranca()
    await repositorio.salvar(pagamento)

    const recuperado = await repositorio.buscarPorId(pagamento.id)
    assert.exists(recuperado)
    assert.equal(recuperado!.total.centavos, 20000)
    assert.equal(recuperado!.pago.centavos, 0)
    assert.equal(recuperado!.status, StatusPagamento.PENDENTE)
    assert.isNull(recuperado!.notaFiscalNumero)
  })

  test('busca por ordem', async ({ assert }) => {
    const ordemId = randomUUID()
    await repositorio.salvar(novaCobranca(ordemId))

    const recuperado = await repositorio.buscarPorOrdem(ordemId)
    assert.exists(recuperado)
    assert.equal(recuperado!.ordemId, ordemId)
  })

  test('persiste desconto, quitação e nota fiscal', async ({ assert }) => {
    const pagamento = novaCobranca(randomUUID(), 200)
    pagamento.aplicarDesconto(Dinheiro.deReais(20))
    pagamento.registrarPagamento(Dinheiro.deReais(180)) // devido = 180 -> QUITADO
    pagamento.emitirNotaFiscal('NF-123')
    await repositorio.salvar(pagamento)

    const recuperado = await repositorio.buscarPorId(pagamento.id)
    assert.equal(recuperado!.desconto.centavos, 2000)
    assert.equal(recuperado!.pago.centavos, 18000)
    assert.equal(recuperado!.status, StatusPagamento.QUITADO)
    assert.equal(recuperado!.notaFiscalNumero, 'NF-123')
  })

  test('persiste pagamento parcial', async ({ assert }) => {
    const pagamento = novaCobranca(randomUUID(), 200)
    pagamento.registrarPagamento(Dinheiro.deReais(50))
    await repositorio.salvar(pagamento)

    const recuperado = await repositorio.buscarPorId(pagamento.id)
    assert.equal(recuperado!.status, StatusPagamento.PARCIAL)
    assert.equal(recuperado!.pago.centavos, 5000)
  })

  test('lista os pagamentos', async ({ assert }) => {
    await repositorio.salvar(novaCobranca())
    await repositorio.salvar(novaCobranca())
    assert.lengthOf(await repositorio.listar(), 2)
  })
})
