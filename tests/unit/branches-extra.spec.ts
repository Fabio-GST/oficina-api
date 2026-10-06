import { test } from '@japa/runner'
import { capturarErro } from '#tests/helpers/erros'
import { ErroDeValidacao, NaoAutenticado, RegraDeNegocioViolada } from '#shared/entities/erros'
import { Dinheiro } from '#shared/entities/objetos-de-valor/dinheiro'
import { Email } from '#modulos/autenticacao/entities/objetos-de-valor/email'
import { Peca } from '#modulos/estoque/entities/peca'
import { QuantidadeEstoque } from '#modulos/estoque/entities/objetos-de-valor/quantidade-estoque'
import { Servico } from '#modulos/servicos/entities/servico'
import { Pagamento } from '#modulos/pagamento/entities/pagamento'
import { servicoJwt } from '#shared/frameworks-drivers/jwt/servico-jwt'

test.group('Branches extras', () => {
  test('Email.toString devolve o valor normalizado', ({ assert }) => {
    assert.equal(Email.criar('joao@oficina.com').toString(), 'joao@oficina.com')
  })

  test('Peca valida o estoque mínimo na criação e no ajuste', async ({ assert }) => {
    assert.instanceOf(
      await capturarErro(async () =>
        Peca.criar({
          nome: 'X',
          preco: Dinheiro.deReais(1),
          quantidadeEstoque: QuantidadeEstoque.criar(1),
          estoqueMinimo: -1,
        })
      ),
      ErroDeValidacao
    )
    const peca = Peca.criar({
      nome: 'X',
      preco: Dinheiro.deReais(1),
      quantidadeEstoque: QuantidadeEstoque.criar(1),
    })
    assert.instanceOf(
      await capturarErro(async () => peca.definirEstoqueMinimo(-2)),
      ErroDeValidacao
    )
  })

  test('Servico.atualizar rejeita nome vazio', async ({ assert }) => {
    const servico = Servico.criar({ nome: 'Troca', preco: Dinheiro.deReais(10) })
    assert.instanceOf(
      await capturarErro(async () => servico.atualizar({ nome: '  ' })),
      ErroDeValidacao
    )
  })

  test('Pagamento.emitirNotaFiscal é idempotente', ({ assert }) => {
    const p = Pagamento.gerarCobranca({ ordemId: 'os1', total: Dinheiro.deReais(100) })
    p.registrarPagamento(Dinheiro.deReais(100))
    p.emitirNotaFiscal('NF-1')
    p.emitirNotaFiscal('NF-2') // idempotente: mantém a primeira
    assert.equal(p.notaFiscalNumero, 'NF-1')
  })

  test('Pagamento quitado não pode receber desconto', async ({ assert }) => {
    const p = Pagamento.gerarCobranca({ ordemId: 'os1', total: Dinheiro.deReais(100) })
    p.registrarPagamento(Dinheiro.deReais(100))
    assert.instanceOf(
      await capturarErro(async () => p.aplicarDesconto(Dinheiro.deReais(10))),
      RegraDeNegocioViolada
    )
  })

  test('ServicoJwt.verificar rejeita token inválido', async ({ assert }) => {
    assert.instanceOf(
      await capturarErro(async () => servicoJwt.verificar('token-invalido')),
      NaoAutenticado
    )
  })
})
