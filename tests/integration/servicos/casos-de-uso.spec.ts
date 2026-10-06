import { test } from '@japa/runner'
import { executar } from '#tests/helpers/container'
import { CriarServico } from '#modulos/servicos/use-cases/criar-servico'
import { AtualizarServico } from '#modulos/servicos/use-cases/atualizar-servico'
import { InativarServico } from '#modulos/servicos/use-cases/inativar-servico'
import { ReativarServico } from '#modulos/servicos/use-cases/reativar-servico'
import { DefinirTempoEstimado } from '#modulos/servicos/use-cases/definir-tempo-estimado'
import { ObterServico } from '#modulos/servicos/use-cases/obter-servico'
import { ListarServicos } from '#modulos/servicos/use-cases/listar-servicos'
import { RemoverServico } from '#modulos/servicos/use-cases/remover-servico'
import { prepararBanco } from '#tests/helpers/banco'
import { capturarErro } from '#tests/helpers/erros'
import { RecursoNaoEncontrado, RegraDeNegocioViolada } from '#shared/entities/erros'

test.group('Casos de uso de Serviços', (group) => {
  prepararBanco(group)

  async function criar(nome = 'Troca de óleo') {
    return executar(CriarServico, { nome, preco: 120, tempoEstimadoMinutos: 30 })
  }

  test('cria e obtém um serviço', async ({ assert }) => {
    const criado = await criar()
    const obtido = await executar(ObterServico, criado.id)
    assert.equal(obtido.nome, 'Troca de óleo')
    assert.equal(obtido.preco, 120)
    assert.isTrue(obtido.ativo)
  })

  test('atualiza nome e preço', async ({ assert }) => {
    const criado = await criar()
    const atualizado = await executar(AtualizarServico, {
      id: criado.id,
      nome: 'Revisão',
      preco: 200,
    })
    assert.equal(atualizado.nome, 'Revisão')
    assert.equal(atualizado.preco, 200)
  })

  test('inativa e reativa', async ({ assert }) => {
    const criado = await criar()
    const inativado = await executar(InativarServico, criado.id)
    assert.isFalse(inativado.ativo)
    const reativado = await executar(ReativarServico, criado.id)
    assert.isTrue(reativado.ativo)
  })

  test('atualizar serviço inativo viola regra de negócio', async ({ assert }) => {
    const criado = await criar()
    await executar(InativarServico, criado.id)
    const erro = await capturarErro(async () =>
      executar(AtualizarServico, { id: criado.id, preco: 300 })
    )
    assert.instanceOf(erro, RegraDeNegocioViolada)
  })

  test('define tempo estimado', async ({ assert }) => {
    const criado = await criar()
    const atualizado = await executar(DefinirTempoEstimado, {
      id: criado.id,
      tempoEstimadoMinutos: 45,
    })
    assert.equal(atualizado.tempoEstimadoMinutos, 45)
  })

  test('operações sobre serviço inexistente lançam RecursoNaoEncontrado', async ({ assert }) => {
    assert.instanceOf(
      await capturarErro(async () => executar(ObterServico, 'x')),
      RecursoNaoEncontrado
    )
    assert.instanceOf(
      await capturarErro(async () => executar(AtualizarServico, { id: 'x', nome: 'Z' })),
      RecursoNaoEncontrado
    )
    assert.instanceOf(
      await capturarErro(async () => executar(InativarServico, 'x')),
      RecursoNaoEncontrado
    )
    assert.instanceOf(
      await capturarErro(async () => executar(ReativarServico, 'x')),
      RecursoNaoEncontrado
    )
    assert.instanceOf(
      await capturarErro(async () =>
        executar(DefinirTempoEstimado, { id: 'x', tempoEstimadoMinutos: 10 })
      ),
      RecursoNaoEncontrado
    )
    assert.instanceOf(
      await capturarErro(async () => executar(RemoverServico, 'x')),
      RecursoNaoEncontrado
    )
  })

  test('lista e remove', async ({ assert }) => {
    const criado = await criar()
    assert.lengthOf(await executar(ListarServicos), 1)
    await executar(RemoverServico, criado.id)
    assert.lengthOf(await executar(ListarServicos), 0)
  })
})
