import { test } from '@japa/runner'
import {
  SolicitacaoDeCompra,
  StatusSolicitacao,
} from '#modulos/estoque/entities/solicitacao-de-compra'

test.group('SolicitacaoDeCompra (agregado)', () => {
  test('nasce SOLICITADA e registra estoque.compra-solicitada', ({ assert }) => {
    const solicitacao = SolicitacaoDeCompra.criar({ pecaId: 'peca-1', quantidade: 5 })
    assert.equal(solicitacao.status, StatusSolicitacao.SOLICITADA)
    const eventos = solicitacao.extrairEventos()
    assert.lengthOf(eventos, 1)
    assert.equal(eventos[0].nome, 'estoque.compra-solicitada')
  })

  test('rejeita quantidade não positiva', ({ assert }) => {
    assert.throws(() => SolicitacaoDeCompra.criar({ pecaId: 'peca-1', quantidade: 0 }))
  })

  test('receber marca como RECEBIDA', ({ assert }) => {
    const solicitacao = SolicitacaoDeCompra.criar({ pecaId: 'peca-1', quantidade: 5 })
    solicitacao.receber()
    assert.equal(solicitacao.status, StatusSolicitacao.RECEBIDA)
    assert.isNotNull(solicitacao.recebidaEm)
  })

  test('não recebe duas vezes', ({ assert }) => {
    const solicitacao = SolicitacaoDeCompra.criar({ pecaId: 'peca-1', quantidade: 5 })
    solicitacao.receber()
    assert.throws(() => solicitacao.receber())
  })
})
