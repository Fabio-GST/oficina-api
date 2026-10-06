import { test } from '@japa/runner'
import { prepararBanco } from '#tests/helpers/banco'
import { capturarErro } from '#tests/helpers/erros'
import { gerarCpf } from '#tests/helpers/dados'
import { fazer } from '#tests/helpers/container'
import { ConflitoDeRecurso, RecursoNaoEncontrado } from '#shared/entities/erros'
import { CriarCliente } from '#modulos/clientes/use-cases/criar-cliente'
import { AtualizarCliente } from '#modulos/clientes/use-cases/atualizar-cliente'
import { BuscarClientePorDocumento } from '#modulos/clientes/use-cases/buscar-cliente-por-documento'
import { ObterCliente } from '#modulos/clientes/use-cases/obter-cliente'
import { ListarClientes } from '#modulos/clientes/use-cases/listar-clientes'
import { RemoverCliente } from '#modulos/clientes/use-cases/remover-cliente'

test.group('Casos de uso de Clientes', (group) => {
  prepararBanco(group)

  test('cria e obtém um cliente', async ({ assert }) => {
    const criar = await fazer(CriarCliente)
    const obter = await fazer(ObterCliente)
    const criado = await criar.executar({ nome: 'Maria', documento: gerarCpf() })
    const obtido = await obter.executar(criado.id)
    assert.equal(obtido.nome, 'Maria')
    assert.equal(obtido.tipoDocumento, 'CPF')
  })

  test('rejeita documento duplicado com ConflitoDeRecurso', async ({ assert }) => {
    const criar = await fazer(CriarCliente)
    const doc = gerarCpf()
    await criar.executar({ nome: 'A', documento: doc })
    const erro = await capturarErro(() => criar.executar({ nome: 'B', documento: doc }))
    assert.instanceOf(erro, ConflitoDeRecurso)
  })

  test('atualiza um cliente existente', async ({ assert }) => {
    const criar = await fazer(CriarCliente)
    const atualizar = await fazer(AtualizarCliente)
    const criado = await criar.executar({ nome: 'Ana', documento: gerarCpf() })
    const atualizado = await atualizar.executar({
      id: criado.id,
      nome: 'Ana Paula',
      telefone: '1133334444',
    })
    assert.equal(atualizado.nome, 'Ana Paula')
    assert.equal(atualizado.telefone, '1133334444')
  })

  test('atualizar inexistente lança RecursoNaoEncontrado', async ({ assert }) => {
    const atualizar = await fazer(AtualizarCliente)
    const erro = await capturarErro(() => atualizar.executar({ id: 'x', nome: 'Z' }))
    assert.instanceOf(erro, RecursoNaoEncontrado)
  })

  test('obter inexistente lança RecursoNaoEncontrado', async ({ assert }) => {
    const obter = await fazer(ObterCliente)
    const erro = await capturarErro(() => obter.executar('x'))
    assert.instanceOf(erro, RecursoNaoEncontrado)
  })

  test('remover inexistente lança RecursoNaoEncontrado', async ({ assert }) => {
    const remover = await fazer(RemoverCliente)
    const erro = await capturarErro(() => remover.executar('x'))
    assert.instanceOf(erro, RecursoNaoEncontrado)
  })

  test('remove um cliente existente', async ({ assert }) => {
    const criar = await fazer(CriarCliente)
    const remover = await fazer(RemoverCliente)
    const listar = await fazer(ListarClientes)
    const criado = await criar.executar({ nome: 'Del', documento: gerarCpf() })
    await remover.executar(criado.id)
    assert.lengthOf(await listar.executar(), 0)
  })

  test('busca por documento: encontrado e não encontrado', async ({ assert }) => {
    const criar = await fazer(CriarCliente)
    const buscar = await fazer(BuscarClientePorDocumento)
    const doc = gerarCpf()
    await criar.executar({ nome: 'Busca', documento: doc })

    const achado = await buscar.executar(doc)
    assert.equal(achado!.nome, 'Busca')

    const naoAchado = await buscar.executar(gerarCpf())
    assert.isNull(naoAchado)
  })
})
