import { test } from '@japa/runner'
import { Dinheiro } from '#shared/entities/objetos-de-valor/dinheiro'
import { Peca } from '#modulos/estoque/entities/peca'
import { QuantidadeEstoque } from '#modulos/estoque/entities/objetos-de-valor/quantidade-estoque'

function novaPeca(estoque = 10, estoqueMinimo = 0) {
  return Peca.criar({
    nome: 'Filtro de óleo',
    preco: Dinheiro.deReais(30),
    quantidadeEstoque: QuantidadeEstoque.criar(estoque),
    estoqueMinimo,
  })
}

test.group('Peca (agregado de estoque)', () => {
  test('dá baixa no estoque', ({ assert }) => {
    const peca = novaPeca(10)
    peca.darBaixa(4)
    assert.equal(peca.quantidadeEstoque.valor, 6)
  })

  test('repõe o estoque', ({ assert }) => {
    const peca = novaPeca(5)
    peca.repor(10)
    assert.equal(peca.quantidadeEstoque.valor, 15)
  })

  test('define o estoque para um valor absoluto', ({ assert }) => {
    const peca = novaPeca(5)
    peca.definirEstoque(100)
    assert.equal(peca.quantidadeEstoque.valor, 100)
  })

  test('impede baixa maior que o disponível', ({ assert }) => {
    const peca = novaPeca(3)
    assert.throws(() => peca.darBaixa(5))
  })

  test('atualiza nome, descrição e preço', ({ assert }) => {
    const peca = novaPeca()
    peca.atualizar({
      nome: 'Filtro premium',
      descricao: 'Alta durabilidade',
      preco: Dinheiro.deReais(55),
    })
    assert.equal(peca.nome, 'Filtro premium')
    assert.equal(peca.descricao, 'Alta durabilidade')
    assert.equal(peca.preco.reais, 55)
  })

  test('rejeita nome vazio na criação', ({ assert }) => {
    assert.throws(() =>
      Peca.criar({
        nome: '   ',
        preco: Dinheiro.deReais(10),
        quantidadeEstoque: QuantidadeEstoque.criar(1),
      })
    )
  })

  test('reservar bloqueia quantidade e registra evento', ({ assert }) => {
    const peca = novaPeca(10)
    peca.extrairEventos() // descarta evento de criação
    peca.reservar(3)
    assert.equal(peca.quantidadeEstoque.valor, 7)
    assert.equal(peca.quantidadeReservada, 3)
    assert.equal(peca.extrairEventos()[0].nome, 'estoque.peca-reservada')
  })

  test('utilizar consome do reservado e registra evento', ({ assert }) => {
    const peca = novaPeca(10)
    peca.reservar(4)
    peca.extrairEventos()
    peca.utilizar(4)
    assert.equal(peca.quantidadeReservada, 0)
    assert.equal(peca.extrairEventos()[0].nome, 'estoque.peca-utilizada')
  })

  test('utilizar sem reserva suficiente falha', ({ assert }) => {
    const peca = novaPeca(10)
    assert.throws(() => peca.utilizar(1))
  })

  test('emite alerta quando o disponível cai abaixo do mínimo', ({ assert }) => {
    const peca = novaPeca(5, 4)
    peca.extrairEventos()
    peca.darBaixa(2) // disponível 3 < mínimo 4
    const nomes = peca.extrairEventos().map((e) => e.nome)
    assert.include(nomes, 'estoque.abaixo-do-minimo')
  })

  test('não emite alerta quando o disponível permanece no mínimo ou acima', ({ assert }) => {
    const peca = novaPeca(5, 4)
    peca.extrairEventos()
    peca.darBaixa(1) // disponível 4 == mínimo 4
    const nomes = peca.extrairEventos().map((e) => e.nome)
    assert.notInclude(nomes, 'estoque.abaixo-do-minimo')
  })
})
