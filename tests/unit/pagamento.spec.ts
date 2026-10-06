import { test } from '@japa/runner'
import { Dinheiro } from '#shared/entities/objetos-de-valor/dinheiro'
import { Pagamento, StatusPagamento } from '#modulos/pagamento/entities/pagamento'

function novaCobranca(total = 200) {
  return Pagamento.gerarCobranca({ ordemId: 'os-1', total: Dinheiro.deReais(total) })
}

test.group('Pagamento (agregado)', () => {
  test('gerar cobrança nasce PENDENTE e registra pagamento.cobranca-gerada', ({ assert }) => {
    const pagamento = novaCobranca(200)
    assert.equal(pagamento.status, StatusPagamento.PENDENTE)
    assert.equal(pagamento.extrairEventos()[0].nome, 'pagamento.cobranca-gerada')
  })

  test('pagamento parcial marca PARCIAL e não confirma', ({ assert }) => {
    const pagamento = novaCobranca(200)
    pagamento.extrairEventos()
    pagamento.registrarPagamento(Dinheiro.deReais(50))
    assert.equal(pagamento.status, StatusPagamento.PARCIAL)
    const nomes = pagamento.extrairEventos().map((e) => e.nome)
    assert.notInclude(nomes, 'pagamento.confirmado')
  })

  test('pagamento integral marca QUITADO e registra pagamento.confirmado', ({ assert }) => {
    const pagamento = novaCobranca(200)
    pagamento.extrairEventos()
    pagamento.registrarPagamento(Dinheiro.deReais(200))
    assert.equal(pagamento.status, StatusPagamento.QUITADO)
    const nomes = pagamento.extrairEventos().map((e) => e.nome)
    assert.include(nomes, 'pagamento.confirmado')
  })

  test('desconto reduz o valor devido e antecipa a quitação', ({ assert }) => {
    const pagamento = novaCobranca(200)
    pagamento.aplicarDesconto(Dinheiro.deReais(50))
    assert.equal(pagamento.valorDevido().reais, 150)
    pagamento.extrairEventos()
    pagamento.registrarPagamento(Dinheiro.deReais(150))
    assert.equal(pagamento.status, StatusPagamento.QUITADO)
  })

  test('desconto não pode exceder o total', ({ assert }) => {
    const pagamento = novaCobranca(200)
    assert.throws(() => pagamento.aplicarDesconto(Dinheiro.deReais(250)))
  })

  test('nota fiscal só é emitida após a quitação e é idempotente', ({ assert }) => {
    const pagamento = novaCobranca(200)
    assert.throws(() => pagamento.emitirNotaFiscal('NF-1'))
    pagamento.registrarPagamento(Dinheiro.deReais(200))
    pagamento.extrairEventos()
    pagamento.emitirNotaFiscal('NF-1')
    assert.equal(pagamento.notaFiscalNumero, 'NF-1')
    assert.equal(pagamento.extrairEventos()[0].nome, 'pagamento.nota-emitida')
    pagamento.emitirNotaFiscal('NF-2') // idempotente: não troca nem reemite
    assert.equal(pagamento.notaFiscalNumero, 'NF-1')
    assert.lengthOf(pagamento.extrairEventos(), 0)
  })

  test('não registra pagamento após quitado', ({ assert }) => {
    const pagamento = novaCobranca(200)
    pagamento.registrarPagamento(Dinheiro.deReais(200))
    assert.throws(() => pagamento.registrarPagamento(Dinheiro.deReais(10)))
  })
})
