import { test } from '@japa/runner'
import { SaldoEstoque } from '#modulos/estoque/entities/objetos-de-valor/saldo-estoque'

test.group('SaldoEstoque (VO)', () => {
  test('reservar move do disponível para reservado', ({ assert }) => {
    const saldo = SaldoEstoque.criar(10).reservar(4)
    assert.equal(saldo.disponivel, 6)
    assert.equal(saldo.reservada, 4)
    assert.equal(saldo.total, 10)
  })

  test('não reserva acima do disponível', ({ assert }) => {
    assert.throws(() => SaldoEstoque.criar(3).reservar(5))
  })

  test('utilizar consome do reservado', ({ assert }) => {
    const saldo = SaldoEstoque.criar(10).reservar(4).utilizar(3)
    assert.equal(saldo.disponivel, 6)
    assert.equal(saldo.reservada, 1)
  })

  test('não utiliza acima do reservado', ({ assert }) => {
    assert.throws(() => SaldoEstoque.criar(10).reservar(2).utilizar(3))
  })

  test('liberar reserva devolve ao disponível', ({ assert }) => {
    const saldo = SaldoEstoque.criar(10).reservar(4).liberarReserva(4)
    assert.equal(saldo.disponivel, 10)
    assert.equal(saldo.reservada, 0)
  })

  test('baixa direta reduz o disponível mantendo reservas', ({ assert }) => {
    const saldo = SaldoEstoque.criar(10).reservar(2).baixarDireto(3)
    assert.equal(saldo.disponivel, 5)
    assert.equal(saldo.reservada, 2)
  })

  test('rejeita quantidade não positiva', ({ assert }) => {
    assert.throws(() => SaldoEstoque.criar(10).reservar(0))
    assert.throws(() => SaldoEstoque.criar(10).utilizar(-1))
  })
})
