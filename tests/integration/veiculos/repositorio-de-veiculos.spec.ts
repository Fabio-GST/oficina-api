import { test } from '@japa/runner'
import { prepararBanco } from '#tests/helpers/banco'
import { gerarCpf } from '#tests/helpers/dados'
import { Cliente } from '#modulos/clientes/entities/cliente'
import { Documento } from '#modulos/clientes/entities/objetos-de-valor/documento'
import { RepositorioDeClientesLucid } from '#modulos/clientes/interface-adapters/gateways/repositorio-de-clientes-lucid'
import { Veiculo } from '#modulos/veiculos/entities/veiculo'
import { Placa } from '#modulos/veiculos/entities/objetos-de-valor/placa'
import { RepositorioDeVeiculosLucid } from '#modulos/veiculos/interface-adapters/gateways/repositorio-de-veiculos-lucid'

test.group('RepositorioDeVeiculosLucid', (group) => {
  prepararBanco(group)
  const clientes = new RepositorioDeClientesLucid()
  const repositorio = new RepositorioDeVeiculosLucid()

  /** Cria e persiste um cliente (a FK do veículo exige um cliente existente). */
  async function criarCliente() {
    const cliente = Cliente.criar({ nome: 'Dono', documento: Documento.criar(gerarCpf()) })
    await clientes.salvar(cliente)
    return cliente.id
  }

  test('salva e recupera um veículo por id', async ({ assert }) => {
    const clienteId = await criarCliente()
    const veiculo = Veiculo.criar({
      clienteId,
      placa: Placa.criar('ABC1D23'),
      marca: 'Fiat',
      modelo: 'Uno',
      ano: 2020,
    })

    await repositorio.salvar(veiculo)
    const recuperado = await repositorio.buscarPorId(veiculo.id)

    assert.exists(recuperado)
    assert.equal(recuperado!.clienteId, clienteId)
    assert.equal(recuperado!.placa.valor, 'ABC1D23')
    assert.equal(recuperado!.marca, 'Fiat')
    assert.equal(recuperado!.modelo, 'Uno')
    assert.equal(recuperado!.ano, 2020)
  })

  test('busca por placa e confirma existência', async ({ assert }) => {
    const clienteId = await criarCliente()
    const placa = Placa.criar('ABC1D23')
    await repositorio.salvar(
      Veiculo.criar({ clienteId, placa, marca: 'VW', modelo: 'Gol', ano: 2019 })
    )

    assert.isTrue(await repositorio.existeComPlaca(placa))
    const achado = await repositorio.buscarPorPlaca(placa)
    assert.equal(achado!.modelo, 'Gol')
  })

  test('lista veículos por cliente', async ({ assert }) => {
    const clienteId = await criarCliente()
    const outroCliente = await criarCliente()
    await repositorio.salvar(
      Veiculo.criar({
        clienteId,
        placa: Placa.criar('ABC1D23'),
        marca: 'Fiat',
        modelo: 'Uno',
        ano: 2020,
      })
    )
    await repositorio.salvar(
      Veiculo.criar({
        clienteId,
        placa: Placa.criar('XYZ9K88'),
        marca: 'Fiat',
        modelo: 'Mobi',
        ano: 2021,
      })
    )
    await repositorio.salvar(
      Veiculo.criar({
        clienteId: outroCliente,
        placa: Placa.criar('JKL4M56'),
        marca: 'GM',
        modelo: 'Onix',
        ano: 2022,
      })
    )

    const doCliente = await repositorio.listarPorCliente(clienteId)
    assert.lengthOf(doCliente, 2)
  })

  test('atualiza e transfere o veículo de cliente', async ({ assert }) => {
    const clienteId = await criarCliente()
    const novoDono = await criarCliente()
    const veiculo = Veiculo.criar({
      clienteId,
      placa: Placa.criar('ABC1D23'),
      marca: 'Fiat',
      modelo: 'Uno',
      ano: 2020,
    })
    await repositorio.salvar(veiculo)

    veiculo.atualizar({ modelo: 'Uno Way', ano: 2021 })
    veiculo.vincularCliente(novoDono)
    await repositorio.salvar(veiculo)

    const recuperado = await repositorio.buscarPorId(veiculo.id)
    assert.equal(recuperado!.modelo, 'Uno Way')
    assert.equal(recuperado!.ano, 2021)
    assert.equal(recuperado!.clienteId, novoDono)
  })

  test('remove um veículo', async ({ assert }) => {
    const clienteId = await criarCliente()
    const veiculo = Veiculo.criar({
      clienteId,
      placa: Placa.criar('ABC1D23'),
      marca: 'Fiat',
      modelo: 'Uno',
      ano: 2020,
    })
    await repositorio.salvar(veiculo)
    await repositorio.remover(veiculo.id)
    assert.isNull(await repositorio.buscarPorId(veiculo.id))
  })
})
