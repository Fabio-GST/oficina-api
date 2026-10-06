import { test } from '@japa/runner'
import { executar } from '#tests/helpers/container'
import { CriarPeca } from '#modulos/estoque/use-cases/criar-peca'
import { AtualizarPeca } from '#modulos/estoque/use-cases/atualizar-peca'
import { AjustarEstoque } from '#modulos/estoque/use-cases/ajustar-estoque'
import { ReservarPeca } from '#modulos/estoque/use-cases/reservar-peca'
import { LiberarReservaDePeca } from '#modulos/estoque/use-cases/liberar-reserva-de-peca'
import { UtilizarPeca } from '#modulos/estoque/use-cases/utilizar-peca'
import { DefinirEstoqueMinimo } from '#modulos/estoque/use-cases/definir-estoque-minimo'
import { SolicitarCompra } from '#modulos/estoque/use-cases/solicitar-compra'
import { ReceberCompra } from '#modulos/estoque/use-cases/receber-compra'
import { ObterPeca } from '#modulos/estoque/use-cases/obter-peca'
import { ListarPecas } from '#modulos/estoque/use-cases/listar-pecas'
import { RemoverPeca } from '#modulos/estoque/use-cases/remover-peca'
import { prepararBanco } from '#tests/helpers/banco'
import { capturarErro } from '#tests/helpers/erros'
import { RecursoNaoEncontrado } from '#shared/entities/erros'
import { StatusSolicitacao } from '#modulos/estoque/entities/solicitacao-de-compra'

test.group('Casos de uso de Estoque', (group) => {
  prepararBanco(group)

  async function criarPeca(nome = 'Óleo', quantidade = 10) {
    return executar(CriarPeca, {
      nome,
      preco: 45,
      quantidadeEstoque: quantidade,
      estoqueMinimo: 2,
    })
  }

  test('cria, obtém, atualiza e remove uma peça', async ({ assert }) => {
    const peca = await criarPeca()
    const obtida = await executar(ObterPeca, peca.id)
    assert.equal(obtida.nome, 'Óleo')

    const atualizada = await executar(AtualizarPeca, { id: peca.id, nome: 'Óleo 5W30', preco: 50 })
    assert.equal(atualizada.nome, 'Óleo 5W30')
    assert.equal(atualizada.preco, 50)

    await executar(RemoverPeca, peca.id)
    assert.lengthOf(await executar(ListarPecas), 0)
  })

  test('ajusta, reserva, libera e utiliza estoque', async ({ assert }) => {
    const peca = await criarPeca('Filtro', 10)

    const ajustada = await executar(AjustarEstoque, { id: peca.id, quantidade: 20 })
    assert.equal(ajustada.quantidadeEstoque, 20)

    const reservada = await executar(ReservarPeca, { id: peca.id, quantidade: 5 })
    assert.equal(reservada.quantidadeEstoque, 15)
    assert.equal(reservada.quantidadeReservada, 5)

    const liberada = await executar(LiberarReservaDePeca, { id: peca.id, quantidade: 2 })
    assert.equal(liberada.quantidadeReservada, 3)

    const utilizada = await executar(UtilizarPeca, { id: peca.id, quantidade: 3 })
    assert.equal(utilizada.quantidadeReservada, 0)
    assert.equal(utilizada.quantidadeEstoque, 17)
  })

  test('define estoque mínimo', async ({ assert }) => {
    const peca = await criarPeca()
    const atualizada = await executar(DefinirEstoqueMinimo, { id: peca.id, estoqueMinimo: 8 })
    assert.equal(atualizada.estoqueMinimo, 8)
  })

  test('operações sobre peça inexistente lançam RecursoNaoEncontrado', async ({ assert }) => {
    assert.instanceOf(
      await capturarErro(async () => executar(ObterPeca, 'x')),
      RecursoNaoEncontrado
    )
    assert.instanceOf(
      await capturarErro(async () => executar(AtualizarPeca, { id: 'x', nome: 'Z' })),
      RecursoNaoEncontrado
    )
    assert.instanceOf(
      await capturarErro(async () => executar(AjustarEstoque, { id: 'x', quantidade: 1 })),
      RecursoNaoEncontrado
    )
    assert.instanceOf(
      await capturarErro(async () => executar(ReservarPeca, { id: 'x', quantidade: 1 })),
      RecursoNaoEncontrado
    )
    assert.instanceOf(
      await capturarErro(async () => executar(LiberarReservaDePeca, { id: 'x', quantidade: 1 })),
      RecursoNaoEncontrado
    )
    assert.instanceOf(
      await capturarErro(async () => executar(UtilizarPeca, { id: 'x', quantidade: 1 })),
      RecursoNaoEncontrado
    )
    assert.instanceOf(
      await capturarErro(async () => executar(DefinirEstoqueMinimo, { id: 'x', estoqueMinimo: 1 })),
      RecursoNaoEncontrado
    )
    assert.instanceOf(
      await capturarErro(async () => executar(RemoverPeca, 'x')),
      RecursoNaoEncontrado
    )
  })

  test('solicita e recebe uma compra (repõe o estoque)', async ({ assert }) => {
    const peca = await criarPeca('Correia', 1)
    const solicitacao = await executar(SolicitarCompra, { pecaId: peca.id, quantidade: 10 })
    assert.equal(solicitacao.status, StatusSolicitacao.SOLICITADA)

    const recebida = await executar(ReceberCompra, solicitacao.id)
    assert.equal(recebida.status, StatusSolicitacao.RECEBIDA)

    const atual = await executar(ObterPeca, peca.id)
    assert.equal(atual.quantidadeEstoque, 11) // 1 + 10
  })

  test('solicitar compra para peça inexistente lança RecursoNaoEncontrado', async ({ assert }) => {
    const erro = await capturarErro(async () =>
      executar(SolicitarCompra, { pecaId: 'x', quantidade: 1 })
    )
    assert.instanceOf(erro, RecursoNaoEncontrado)
  })

  test('receber compra inexistente lança RecursoNaoEncontrado', async ({ assert }) => {
    const erro = await capturarErro(async () => executar(ReceberCompra, 'x'))
    assert.instanceOf(erro, RecursoNaoEncontrado)
  })
})
