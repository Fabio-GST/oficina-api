import { test } from '@japa/runner'
import { executar } from '#tests/helpers/container'
import { CriarServico } from '#modulos/servicos/use-cases/criar-servico'
import { InativarServico } from '#modulos/servicos/use-cases/inativar-servico'
import { CriarVeiculo } from '#modulos/veiculos/use-cases/criar-veiculo'
import { CriarPeca } from '#modulos/estoque/use-cases/criar-peca'
import { ObterPeca } from '#modulos/estoque/use-cases/obter-peca'
import { CriarOrdemServico } from '#modulos/ordens-servico/use-cases/criar-ordem-servico'
import {
  AdicionarServicoNaOrdem,
  AdicionarPecaNaOrdem,
} from '#modulos/ordens-servico/use-cases/gerir-itens'
import {
  AlterarStatusDaOrdem,
  AprovarOrdemServico,
  IniciarDiagnostico,
  GerarOrcamento,
  RecusarOrdemServico,
  FinalizarOrdemServico,
  EntregarVeiculo,
} from '#modulos/ordens-servico/use-cases/gerir-status'
import {
  DetalharOrdem,
  ListarOrdens,
  ConsultarAndamento,
  CalcularTempoMedioExecucao,
} from '#modulos/ordens-servico/use-cases/consultas'
import { CriarCliente } from '#modulos/clientes/use-cases/criar-cliente'
import { prepararBanco } from '#tests/helpers/banco'
import { capturarErro } from '#tests/helpers/erros'
import { gerarCpf } from '#tests/helpers/dados'
import { RecursoNaoEncontrado, RegraDeNegocioViolada } from '#shared/entities/erros'
import { StatusOS } from '#modulos/ordens-servico/entities/objetos-de-valor/status-ordem-servico'

test.group('Casos de uso de Ordens de Serviço', (group) => {
  prepararBanco(group)

  async function cenario() {
    const cliente = await executar(CriarCliente, { nome: 'Maria', documento: gerarCpf() })
    const veiculo = await executar(CriarVeiculo, {
      clienteId: cliente.id,
      placa: 'ABC1D23',
      marca: 'Fiat',
      modelo: 'Uno',
      ano: 2020,
    })
    const servico = await executar(CriarServico, { nome: 'Troca de óleo', preco: 120 })
    const peca = await executar(CriarPeca, { nome: 'Óleo', preco: 45, quantidadeEstoque: 10 })
    return { clienteId: cliente.id, veiculoId: veiculo.id, servicoId: servico.id, pecaId: peca.id }
  }

  test('cria OS com serviços e peças, compondo o orçamento e reservando estoque', async ({
    assert,
  }) => {
    const c = await cenario()
    const os = await executar(CriarOrdemServico, {
      clienteId: c.clienteId,
      veiculoId: c.veiculoId,
      servicos: [{ servicoId: c.servicoId, quantidade: 1 }],
      pecas: [{ pecaId: c.pecaId, quantidade: 2 }],
    })

    assert.equal(os.status, StatusOS.RECEBIDA)
    assert.equal(os.orcamento, 210) // 120 + 45*2

    const peca = await executar(ObterPeca, c.pecaId)
    assert.equal(peca.quantidadeReservada, 2)
    assert.equal(peca.quantidadeEstoque, 8)
  })

  test('cria OS para cliente/veículo inexistente lança RecursoNaoEncontrado', async ({
    assert,
  }) => {
    const c = await cenario()
    assert.instanceOf(
      await capturarErro(async () =>
        executar(CriarOrdemServico, { clienteId: 'x', veiculoId: c.veiculoId })
      ),
      RecursoNaoEncontrado
    )
    assert.instanceOf(
      await capturarErro(async () =>
        executar(CriarOrdemServico, { clienteId: c.clienteId, veiculoId: 'x' })
      ),
      RecursoNaoEncontrado
    )
  })

  test('cria OS com veículo de outro cliente viola regra de negócio', async ({ assert }) => {
    const c = await cenario()
    const outro = await executar(CriarCliente, { nome: 'Outro', documento: gerarCpf() })
    const erro = await capturarErro(async () =>
      executar(CriarOrdemServico, { clienteId: outro.id, veiculoId: c.veiculoId })
    )
    assert.instanceOf(erro, RegraDeNegocioViolada)
  })

  test('adiciona serviço a uma OS existente', async ({ assert }) => {
    const c = await cenario()
    const os = await executar(CriarOrdemServico, { clienteId: c.clienteId, veiculoId: c.veiculoId })

    const atualizada = await executar(AdicionarServicoNaOrdem, {
      ordemId: os.id,
      servicoId: c.servicoId,
      quantidade: 1,
    })
    assert.equal(atualizada.orcamento, 120)
  })

  test('adicionar serviço inativo viola regra de negócio', async ({ assert }) => {
    const c = await cenario()
    await executar(InativarServico, c.servicoId)
    const os = await executar(CriarOrdemServico, { clienteId: c.clienteId, veiculoId: c.veiculoId })

    const erro = await capturarErro(async () =>
      executar(AdicionarServicoNaOrdem, {
        ordemId: os.id,
        servicoId: c.servicoId,
        quantidade: 1,
      })
    )
    assert.instanceOf(erro, RegraDeNegocioViolada)
  })

  test('adicionar peça a uma OS reserva o estoque', async ({ assert }) => {
    const c = await cenario()
    const os = await executar(CriarOrdemServico, { clienteId: c.clienteId, veiculoId: c.veiculoId })

    const atualizada = await executar(AdicionarPecaNaOrdem, {
      ordemId: os.id,
      pecaId: c.pecaId,
      quantidade: 3,
    })
    assert.equal(atualizada.orcamento, 135)

    const peca = await executar(ObterPeca, c.pecaId)
    assert.equal(peca.quantidadeReservada, 3)
  })

  test('percorre o ciclo de vida até a entrega e calcula tempo médio', async ({ assert }) => {
    const c = await cenario()
    const os = await executar(CriarOrdemServico, {
      clienteId: c.clienteId,
      veiculoId: c.veiculoId,
      servicos: [{ servicoId: c.servicoId, quantidade: 1 }],
    })

    await executar(IniciarDiagnostico, os.id)
    await executar(GerarOrcamento, os.id)
    const aprovada = await executar(AprovarOrdemServico, os.id)
    assert.equal(aprovada.status, StatusOS.EM_EXECUCAO)

    await executar(FinalizarOrdemServico, os.id)
    const entregue = await executar(EntregarVeiculo, os.id)
    assert.equal(entregue.status, StatusOS.ENTREGUE)

    const detalhe = await executar(DetalharOrdem, os.id)
    assert.equal(detalhe.status, StatusOS.ENTREGUE)

    const andamento = await executar(ConsultarAndamento, os.id)
    assert.equal(andamento.status, StatusOS.ENTREGUE)

    const metrica = await executar(CalcularTempoMedioExecucao)
    assert.isAtLeast(metrica.ordensConsideradas, 1)

    // A OS entregue sai (exclusão lógica) da fila de listagem.
    assert.lengthOf(await executar(ListarOrdens), 0)
  })

  test('lista a fila por prioridade de status, mais antigas primeiro, sem terminais', async ({
    assert,
  }) => {
    const c = await cenario()
    const abrir = () =>
      executar(CriarOrdemServico, {
        clienteId: c.clienteId,
        veiculoId: c.veiculoId,
        servicos: [{ servicoId: c.servicoId, quantidade: 1 }],
      })

    const recebida = await abrir()

    const emDiagnostico = await abrir()
    await executar(IniciarDiagnostico, emDiagnostico.id)

    const aguardando = await abrir()
    await executar(IniciarDiagnostico, aguardando.id)
    await executar(GerarOrcamento, aguardando.id)

    const emExecucao = await abrir()
    await executar(IniciarDiagnostico, emExecucao.id)
    await executar(GerarOrcamento, emExecucao.id)
    await executar(AprovarOrdemServico, emExecucao.id)

    const entregue = await abrir()
    await executar(IniciarDiagnostico, entregue.id)
    await executar(GerarOrcamento, entregue.id)
    await executar(AprovarOrdemServico, entregue.id)
    await executar(FinalizarOrdemServico, entregue.id)
    await executar(EntregarVeiculo, entregue.id)

    const fila = await executar(ListarOrdens)
    assert.deepEqual(
      fila.map((os) => os.id),
      [emExecucao.id, aguardando.id, emDiagnostico.id, recebida.id]
    )
  })

  test('recusa uma OS em aguardando aprovação', async ({ assert }) => {
    const c = await cenario()
    const os = await executar(CriarOrdemServico, {
      clienteId: c.clienteId,
      veiculoId: c.veiculoId,
      servicos: [{ servicoId: c.servicoId, quantidade: 1 }],
    })
    await executar(IniciarDiagnostico, os.id)
    await executar(GerarOrcamento, os.id)
    const recusada = await executar(RecusarOrdemServico, os.id)
    assert.equal(recusada.status, StatusOS.RECUSADA)
  })

  test('alterarStatus com transição inválida viola regra de negócio', async ({ assert }) => {
    const c = await cenario()
    const os = await executar(CriarOrdemServico, { clienteId: c.clienteId, veiculoId: c.veiculoId })
    const erro = await capturarErro(async () =>
      executar(AlterarStatusDaOrdem, {
        ordemId: os.id,
        novoStatus: StatusOS.ENTREGUE,
      })
    )
    assert.instanceOf(erro, RegraDeNegocioViolada)
  })

  test('operações sobre OS inexistente lançam RecursoNaoEncontrado', async ({ assert }) => {
    assert.instanceOf(
      await capturarErro(async () => executar(DetalharOrdem, 'x')),
      RecursoNaoEncontrado
    )
    assert.instanceOf(
      await capturarErro(async () => executar(AprovarOrdemServico, 'x')),
      RecursoNaoEncontrado
    )
    assert.instanceOf(
      await capturarErro(async () =>
        executar(AdicionarServicoNaOrdem, {
          ordemId: 'x',
          servicoId: 'y',
          quantidade: 1,
        })
      ),
      RecursoNaoEncontrado
    )
  })
})
