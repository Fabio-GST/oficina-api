import { test } from '@japa/runner'
import { Placa } from '#modulos/veiculos/entities/objetos-de-valor/placa'

test.group('Placa', () => {
  test('aceita placa no formato antigo e normaliza', ({ assert }) => {
    const placa = Placa.criar('abc-1234')
    assert.equal(placa.valor, 'ABC1234')
  })

  test('aceita placa no formato Mercosul', ({ assert }) => {
    const placa = Placa.criar('ABC1D23')
    assert.equal(placa.valor, 'ABC1D23')
  })

  test('rejeita placa inválida', ({ assert }) => {
    assert.throws(() => Placa.criar('AB-123'))
  })

  test('rejeita placa vazia', ({ assert }) => {
    assert.throws(() => Placa.criar(''))
  })
})
