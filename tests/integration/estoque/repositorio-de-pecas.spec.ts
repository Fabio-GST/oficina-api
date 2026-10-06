import { test } from '@japa/runner'
import { prepararBanco } from '#tests/helpers/banco'
import { Dinheiro } from '#shared/entities/objetos-de-valor/dinheiro'
import { Peca } from '#modulos/estoque/entities/peca'
import { QuantidadeEstoque } from '#modulos/estoque/entities/objetos-de-valor/quantidade-estoque'
import { RepositorioDePecasLucid } from '#modulos/estoque/interface-adapters/gateways/repositorio-de-pecas-lucid'

test.group('RepositorioDePecasLucid', (group) => {
  prepararBanco(group)
  const repositorio = new RepositorioDePecasLucid()

  function novaPeca(nome = 'Óleo 5W30', disponivel = 10) {
    return Peca.criar({
      nome,
      descricao: 'Sintético',
      preco: Dinheiro.deReais(45),
      quantidadeEstoque: QuantidadeEstoque.criar(disponivel),
      estoqueMinimo: 2,
    })
  }

  test('salva e recupera uma peça por id', async ({ assert }) => {
    const peca = novaPeca()
    await repositorio.salvar(peca)

    const recuperada = await repositorio.buscarPorId(peca.id)
    assert.exists(recuperada)
    assert.equal(recuperada!.nome, 'Óleo 5W30')
    assert.equal(recuperada!.preco.centavos, 4500)
    assert.equal(recuperada!.quantidadeEstoque.valor, 10)
    assert.equal(recuperada!.estoqueMinimo, 2)
  })

  test('persiste o saldo de reserva (disponível e reservada)', async ({ assert }) => {
    const peca = novaPeca('Filtro', 10)
    peca.reservar(3)
    await repositorio.salvar(peca)

    const recuperada = await repositorio.buscarPorId(peca.id)
    assert.equal(recuperada!.quantidadeEstoque.valor, 7) // disponível
    assert.equal(recuperada!.quantidadeReservada, 3)
  })

  test('persiste a utilização (baixa efetiva do reservado)', async ({ assert }) => {
    const peca = novaPeca('Pastilha', 10)
    peca.reservar(4)
    peca.utilizar(4)
    await repositorio.salvar(peca)

    const recuperada = await repositorio.buscarPorId(peca.id)
    assert.equal(recuperada!.quantidadeEstoque.valor, 6)
    assert.equal(recuperada!.quantidadeReservada, 0)
  })

  test('buscarVarias retorna apenas os ids pedidos', async ({ assert }) => {
    const a = novaPeca('A')
    const b = novaPeca('B')
    await repositorio.salvar(a)
    await repositorio.salvar(b)

    const varias = await repositorio.buscarVarias([a.id])
    assert.lengthOf(varias, 1)
    assert.equal(varias[0].nome, 'A')
  })

  test('lista e remove peças', async ({ assert }) => {
    const peca = novaPeca()
    await repositorio.salvar(peca)
    assert.lengthOf(await repositorio.listar(), 1)

    await repositorio.remover(peca.id)
    assert.lengthOf(await repositorio.listar(), 0)
  })
})
