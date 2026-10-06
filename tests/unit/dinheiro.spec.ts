import { test } from '@japa/runner'
import { Dinheiro } from '#shared/entities/objetos-de-valor/dinheiro'

test.group('Dinheiro', () => {
  test('cria a partir de reais convertendo para centavos', ({ assert }) => {
    assert.equal(Dinheiro.deReais(99.9).centavos, 9990)
  })

  test('soma valores', ({ assert }) => {
    const total = Dinheiro.deReais(10).somar(Dinheiro.deReais(5.5))
    assert.equal(total.reais, 15.5)
  })

  test('multiplica por quantidade', ({ assert }) => {
    assert.equal(Dinheiro.deReais(10).multiplicar(3).reais, 30)
  })

  test('zero é neutro na soma', ({ assert }) => {
    assert.equal(Dinheiro.zero().somar(Dinheiro.deCentavos(500)).centavos, 500)
  })

  test('rejeita valor negativo', ({ assert }) => {
    assert.throws(() => Dinheiro.deReais(-1))
  })

  test('rejeita centavos não inteiros', ({ assert }) => {
    assert.throws(() => Dinheiro.deCentavos(10.5))
  })
})
