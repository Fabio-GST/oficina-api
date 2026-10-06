import { test } from '@japa/runner'
import { QuantidadeEstoque } from '#modulos/estoque/entities/objetos-de-valor/quantidade-estoque'

test.group('QuantidadeEstoque', () => {
  test('dá baixa reduzindo a quantidade', ({ assert }) => {
    const estoque = QuantidadeEstoque.criar(10).subtrair(3)
    assert.equal(estoque.valor, 7)
  })

  test('repõe somando a quantidade', ({ assert }) => {
    assert.equal(QuantidadeEstoque.criar(5).somar(5).valor, 10)
  })

  test('impede estoque negativo na baixa', ({ assert }) => {
    assert.throws(() => QuantidadeEstoque.criar(2).subtrair(5))
  })

  test('rejeita criação com valor negativo', ({ assert }) => {
    assert.throws(() => QuantidadeEstoque.criar(-1))
  })
})
