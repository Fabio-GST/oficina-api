import { test } from '@japa/runner'
import { prepararBanco } from '#tests/helpers/banco'
import { Dinheiro } from '#shared/entities/objetos-de-valor/dinheiro'
import { Peca } from '#modulos/estoque/entities/peca'
import { QuantidadeEstoque } from '#modulos/estoque/entities/objetos-de-valor/quantidade-estoque'
import {
  SolicitacaoDeCompra,
  StatusSolicitacao,
} from '#modulos/estoque/entities/solicitacao-de-compra'
import { RepositorioDePecasLucid } from '#modulos/estoque/interface-adapters/gateways/repositorio-de-pecas-lucid'
import { RepositorioDeSolicitacoesCompraLucid } from '#modulos/estoque/interface-adapters/gateways/repositorio-de-solicitacoes-compra-lucid'

test.group('RepositorioDeSolicitacoesCompraLucid', (group) => {
  prepararBanco(group)
  const pecas = new RepositorioDePecasLucid()
  const repositorio = new RepositorioDeSolicitacoesCompraLucid()

  /** Cria e persiste uma peça (a FK da solicitação exige uma peça existente). */
  async function criarPeca() {
    const peca = Peca.criar({
      nome: 'Correia',
      preco: Dinheiro.deReais(80),
      quantidadeEstoque: QuantidadeEstoque.criar(1),
      estoqueMinimo: 5,
    })
    await pecas.salvar(peca)
    return peca.id
  }

  test('salva e recupera uma solicitação por id', async ({ assert }) => {
    const pecaId = await criarPeca()
    const solicitacao = SolicitacaoDeCompra.criar({ pecaId, quantidade: 10 })
    await repositorio.salvar(solicitacao)

    const recuperada = await repositorio.buscarPorId(solicitacao.id)
    assert.exists(recuperada)
    assert.equal(recuperada!.pecaId, pecaId)
    assert.equal(recuperada!.quantidade, 10)
    assert.equal(recuperada!.status, StatusSolicitacao.SOLICITADA)
    assert.isNull(recuperada!.recebidaEm)
  })

  test('persiste o recebimento da solicitação', async ({ assert }) => {
    const pecaId = await criarPeca()
    const solicitacao = SolicitacaoDeCompra.criar({ pecaId, quantidade: 5 })
    await repositorio.salvar(solicitacao)

    solicitacao.receber()
    await repositorio.salvar(solicitacao)

    const recuperada = await repositorio.buscarPorId(solicitacao.id)
    assert.equal(recuperada!.status, StatusSolicitacao.RECEBIDA)
    assert.exists(recuperada!.recebidaEm)
  })

  test('lista as solicitações', async ({ assert }) => {
    const pecaId = await criarPeca()
    await repositorio.salvar(SolicitacaoDeCompra.criar({ pecaId, quantidade: 1 }))
    await repositorio.salvar(SolicitacaoDeCompra.criar({ pecaId, quantidade: 2 }))

    assert.lengthOf(await repositorio.listar(), 2)
  })
})
