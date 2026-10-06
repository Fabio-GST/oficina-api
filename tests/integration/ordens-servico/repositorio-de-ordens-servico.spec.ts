import { test } from '@japa/runner'
import { prepararBanco } from '#tests/helpers/banco'
import { gerarCpf } from '#tests/helpers/dados'
import { Dinheiro } from '#shared/entities/objetos-de-valor/dinheiro'
import { Cliente } from '#modulos/clientes/entities/cliente'
import { Documento } from '#modulos/clientes/entities/objetos-de-valor/documento'
import { RepositorioDeClientesLucid } from '#modulos/clientes/interface-adapters/gateways/repositorio-de-clientes-lucid'
import { Veiculo } from '#modulos/veiculos/entities/veiculo'
import { Placa } from '#modulos/veiculos/entities/objetos-de-valor/placa'
import { RepositorioDeVeiculosLucid } from '#modulos/veiculos/interface-adapters/gateways/repositorio-de-veiculos-lucid'
import { OrdemServico } from '#modulos/ordens-servico/entities/ordem-servico'
import { StatusOS } from '#modulos/ordens-servico/entities/objetos-de-valor/status-ordem-servico'
import { RepositorioDeOrdensServicoLucid } from '#modulos/ordens-servico/interface-adapters/gateways/repositorio-de-ordens-servico-lucid'

test.group('RepositorioDeOrdensServicoLucid', (group) => {
  prepararBanco(group)
  const clientes = new RepositorioDeClientesLucid()
  const veiculos = new RepositorioDeVeiculosLucid()
  const repositorio = new RepositorioDeOrdensServicoLucid()

  /** Cria cliente + veículo (FKs obrigatórias da OS) e devolve seus ids. */
  async function criarClienteEVeiculo() {
    const cliente = Cliente.criar({ nome: 'Maria', documento: Documento.criar(gerarCpf()) })
    await clientes.salvar(cliente)
    const veiculo = Veiculo.criar({
      clienteId: cliente.id,
      placa: Placa.criar('ABC1D23'),
      marca: 'Fiat',
      modelo: 'Uno',
      ano: 2020,
    })
    await veiculos.salvar(veiculo)
    return { clienteId: cliente.id, veiculoId: veiculo.id }
  }

  function novaOSCom(clienteId: string, veiculoId: string) {
    const os = OrdemServico.criar({ clienteId, veiculoId })
    os.adicionarServico({
      servicoId: 'srv-1',
      descricao: 'Troca de óleo',
      precoUnitario: Dinheiro.deReais(120),
      quantidade: 1,
    })
    os.adicionarPeca({
      pecaId: 'pc-1',
      descricao: 'Óleo 5W30',
      precoUnitario: Dinheiro.deReais(45),
      quantidade: 2,
    })
    return os
  }

  test('salva e recupera a OS com itens e histórico', async ({ assert }) => {
    const { clienteId, veiculoId } = await criarClienteEVeiculo()
    const os = novaOSCom(clienteId, veiculoId)
    await repositorio.salvar(os)

    const recuperada = await repositorio.buscarPorId(os.id)
    assert.exists(recuperada)
    assert.equal(recuperada!.clienteId, clienteId)
    assert.equal(recuperada!.veiculoId, veiculoId)
    assert.equal(recuperada!.status.valor, StatusOS.RECEBIDA)
    assert.lengthOf(recuperada!.itens, 2)
    assert.lengthOf(recuperada!.historico, 1)

    const peca = recuperada!.itens.find((i) => i.tipo === 'PECA')
    assert.equal(peca!.referenciaId, 'pc-1')
    assert.equal(peca!.quantidade, 2)
    assert.equal(peca!.subtotal.centavos, 9000)
  })

  test('persiste as transições de status e o histórico', async ({ assert }) => {
    const { clienteId, veiculoId } = await criarClienteEVeiculo()
    const os = novaOSCom(clienteId, veiculoId)
    os.iniciarDiagnostico()
    os.gerarOrcamento()
    os.aprovar()
    await repositorio.salvar(os)

    const recuperada = await repositorio.buscarPorId(os.id)
    assert.equal(recuperada!.status.valor, StatusOS.EM_EXECUCAO)
    // RECEBIDA + EM_DIAGNOSTICO + AGUARDANDO_APROVACAO + EM_EXECUCAO
    assert.lengthOf(recuperada!.historico, 4)
  })

  test('atualiza uma OS existente (itens substituídos)', async ({ assert }) => {
    const { clienteId, veiculoId } = await criarClienteEVeiculo()
    const os = OrdemServico.criar({ clienteId, veiculoId })
    os.adicionarServico({
      servicoId: 'srv-1',
      descricao: 'Revisão',
      precoUnitario: Dinheiro.deReais(100),
      quantidade: 1,
    })
    await repositorio.salvar(os)

    os.adicionarPeca({
      pecaId: 'pc-2',
      descricao: 'Filtro',
      precoUnitario: Dinheiro.deReais(30),
      quantidade: 1,
    })
    await repositorio.salvar(os)

    const recuperada = await repositorio.buscarPorId(os.id)
    assert.lengthOf(recuperada!.itens, 2)
  })

  test('lista as ordens de serviço', async ({ assert }) => {
    const { clienteId, veiculoId } = await criarClienteEVeiculo()
    await repositorio.salvar(OrdemServico.criar({ clienteId, veiculoId }))
    await repositorio.salvar(OrdemServico.criar({ clienteId, veiculoId }))

    assert.lengthOf(await repositorio.listar(), 2)
  })

  test('buscarPorId inexistente retorna null', async ({ assert }) => {
    assert.isNull(await repositorio.buscarPorId('nao-existe'))
  })
})
