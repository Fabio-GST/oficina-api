import { randomUUID } from 'node:crypto'
import { test } from '@japa/runner'
import { executar } from '#tests/helpers/container'
import { GerarCobranca } from '#modulos/pagamento/use-cases/gerar-cobranca'
import { AplicarDesconto } from '#modulos/pagamento/use-cases/aplicar-desconto'
import { RegistrarPagamento } from '#modulos/pagamento/use-cases/registrar-pagamento'
import { EmitirNotaFiscal } from '#modulos/pagamento/use-cases/emitir-nota-fiscal'
import { ObterPagamento } from '#modulos/pagamento/use-cases/obter-pagamento'
import { prepararBanco } from '#tests/helpers/banco'
import { capturarErro } from '#tests/helpers/erros'
import { RecursoNaoEncontrado, RegraDeNegocioViolada } from '#shared/entities/erros'
import { StatusPagamento } from '#modulos/pagamento/entities/pagamento'

test.group('Casos de uso de Pagamento', (group) => {
  prepararBanco(group)

  async function gerar(total = 200) {
    return executar(GerarCobranca, { ordemId: randomUUID(), total })
  }

  test('gera cobrança e obtém', async ({ assert }) => {
    const cobranca = await gerar(200)
    assert.equal(cobranca.total, 200)
    assert.equal(cobranca.status, StatusPagamento.PENDENTE)

    const obtido = await executar(ObterPagamento, cobranca.id)
    assert.equal(obtido.id, cobranca.id)
  })

  test('aplica desconto, registra pagamento e emite nota', async ({ assert }) => {
    const cobranca = await gerar(200)
    const comDesconto = await executar(AplicarDesconto, { id: cobranca.id, desconto: 20 })
    assert.equal(comDesconto.valorDevido, 180)

    const pago = await executar(RegistrarPagamento, { id: cobranca.id, valor: 180 })
    assert.equal(pago.status, StatusPagamento.QUITADO)

    const comNota = await executar(EmitirNotaFiscal, cobranca.id)
    assert.exists(comNota.notaFiscalNumero)
  })

  test('registra pagamento parcial', async ({ assert }) => {
    const cobranca = await gerar(200)
    const parcial = await executar(RegistrarPagamento, { id: cobranca.id, valor: 50 })
    assert.equal(parcial.status, StatusPagamento.PARCIAL)
    assert.equal(parcial.pago, 50)
  })

  test('emitir nota antes da quitação viola regra de negócio', async ({ assert }) => {
    const cobranca = await gerar(200)
    const erro = await capturarErro(async () => executar(EmitirNotaFiscal, cobranca.id))
    assert.instanceOf(erro, RegraDeNegocioViolada)
  })

  test('operações sobre pagamento inexistente lançam RecursoNaoEncontrado', async ({ assert }) => {
    assert.instanceOf(
      await capturarErro(async () => executar(ObterPagamento, 'x')),
      RecursoNaoEncontrado
    )
    assert.instanceOf(
      await capturarErro(async () => executar(AplicarDesconto, { id: 'x', desconto: 1 })),
      RecursoNaoEncontrado
    )
    assert.instanceOf(
      await capturarErro(async () => executar(RegistrarPagamento, { id: 'x', valor: 1 })),
      RecursoNaoEncontrado
    )
    assert.instanceOf(
      await capturarErro(async () => executar(EmitirNotaFiscal, 'x')),
      RecursoNaoEncontrado
    )
  })
})
