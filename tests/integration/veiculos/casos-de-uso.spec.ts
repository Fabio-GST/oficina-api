import { test } from '@japa/runner'
import { executar } from '#tests/helpers/container'
import { CriarVeiculo } from '#modulos/veiculos/use-cases/criar-veiculo'
import { AtualizarVeiculo } from '#modulos/veiculos/use-cases/atualizar-veiculo'
import { VincularClienteAoVeiculo } from '#modulos/veiculos/use-cases/vincular-cliente-ao-veiculo'
import { BuscarVeiculoPorPlaca } from '#modulos/veiculos/use-cases/buscar-veiculo-por-placa'
import { ObterVeiculo } from '#modulos/veiculos/use-cases/obter-veiculo'
import { ListarVeiculos } from '#modulos/veiculos/use-cases/listar-veiculos'
import { RemoverVeiculo } from '#modulos/veiculos/use-cases/remover-veiculo'
import { CriarCliente } from '#modulos/clientes/use-cases/criar-cliente'
import { prepararBanco } from '#tests/helpers/banco'
import { capturarErro } from '#tests/helpers/erros'
import { gerarCpf } from '#tests/helpers/dados'
import { ConflitoDeRecurso, RecursoNaoEncontrado } from '#shared/entities/erros'

test.group('Casos de uso de Veículos', (group) => {
  prepararBanco(group)

  async function criarCliente() {
    const c = await executar(CriarCliente, { nome: 'Dono', documento: gerarCpf() })
    return c.id
  }

  function dadosVeiculo(clienteId: string, placa = 'ABC1D23') {
    return { clienteId, placa, marca: 'Fiat', modelo: 'Uno', ano: 2020 }
  }

  test('cria veículo vinculado a um cliente', async ({ assert }) => {
    const clienteId = await criarCliente()
    const veiculo = await executar(CriarVeiculo, dadosVeiculo(clienteId))
    assert.equal(veiculo.clienteId, clienteId)
    assert.equal(veiculo.placa, 'ABC1D23')
  })

  test('criar veículo para cliente inexistente lança RecursoNaoEncontrado', async ({ assert }) => {
    const erro = await capturarErro(async () => executar(CriarVeiculo, dadosVeiculo('inexistente')))
    assert.instanceOf(erro, RecursoNaoEncontrado)
  })

  test('placa duplicada lança ConflitoDeRecurso', async ({ assert }) => {
    const clienteId = await criarCliente()
    await executar(CriarVeiculo, dadosVeiculo(clienteId, 'ABC1D23'))
    const erro = await capturarErro(async () =>
      executar(CriarVeiculo, dadosVeiculo(clienteId, 'ABC1D23'))
    )
    assert.instanceOf(erro, ConflitoDeRecurso)
  })

  test('vincula veículo a outro cliente (transferência)', async ({ assert }) => {
    const clienteId = await criarCliente()
    const novoDono = await criarCliente()
    const veiculo = await executar(CriarVeiculo, dadosVeiculo(clienteId))

    const transferido = await executar(VincularClienteAoVeiculo, {
      id: veiculo.id,
      clienteId: novoDono,
    })
    assert.equal(transferido.clienteId, novoDono)
  })

  test('vincular com veículo ou cliente inexistente lança RecursoNaoEncontrado', async ({
    assert,
  }) => {
    const clienteId = await criarCliente()
    assert.instanceOf(
      await capturarErro(async () => executar(VincularClienteAoVeiculo, { id: 'x', clienteId })),
      RecursoNaoEncontrado
    )
    const veiculo = await executar(CriarVeiculo, dadosVeiculo(clienteId))
    assert.instanceOf(
      await capturarErro(async () =>
        executar(VincularClienteAoVeiculo, {
          id: veiculo.id,
          clienteId: 'inexistente',
        })
      ),
      RecursoNaoEncontrado
    )
  })

  test('busca por placa: encontrado e não encontrado', async ({ assert }) => {
    const clienteId = await criarCliente()
    await executar(CriarVeiculo, dadosVeiculo(clienteId, 'ABC1D23'))

    const achado = await executar(BuscarVeiculoPorPlaca, 'ABC1D23')
    assert.equal(achado!.modelo, 'Uno')
    assert.isNull(await executar(BuscarVeiculoPorPlaca, 'XYZ9K88'))
  })

  test('atualiza, lista por cliente e remove', async ({ assert }) => {
    const clienteId = await criarCliente()
    const veiculo = await executar(CriarVeiculo, dadosVeiculo(clienteId))

    const atualizado = await executar(AtualizarVeiculo, { id: veiculo.id, modelo: 'Uno Way' })
    assert.equal(atualizado.modelo, 'Uno Way')

    const lista = await executar(ListarVeiculos, { clienteId })
    assert.lengthOf(lista, 1)

    await executar(RemoverVeiculo, veiculo.id)
    assert.lengthOf(await executar(ListarVeiculos), 0)
  })

  test('operações sobre veículo inexistente lançam RecursoNaoEncontrado', async ({ assert }) => {
    assert.instanceOf(
      await capturarErro(async () => executar(ObterVeiculo, 'x')),
      RecursoNaoEncontrado
    )
    assert.instanceOf(
      await capturarErro(async () => executar(AtualizarVeiculo, { id: 'x', modelo: 'Z' })),
      RecursoNaoEncontrado
    )
    assert.instanceOf(
      await capturarErro(async () => executar(RemoverVeiculo, 'x')),
      RecursoNaoEncontrado
    )
  })
})
