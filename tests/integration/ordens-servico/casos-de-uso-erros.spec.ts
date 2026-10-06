import { randomUUID } from 'node:crypto'
import { test } from '@japa/runner'
import { executar } from '#tests/helpers/container'
import { CriarServico } from '#modulos/servicos/use-cases/criar-servico'
import { InativarServico } from '#modulos/servicos/use-cases/inativar-servico'
import { CriarVeiculo } from '#modulos/veiculos/use-cases/criar-veiculo'
import { CriarOrdemServico } from '#modulos/ordens-servico/use-cases/criar-ordem-servico'
import {
  AdicionarServicoNaOrdem,
  AdicionarPecaNaOrdem,
} from '#modulos/ordens-servico/use-cases/gerir-itens'
import { AlterarStatusDaOrdem } from '#modulos/ordens-servico/use-cases/gerir-status'
import { ConsultarAndamento } from '#modulos/ordens-servico/use-cases/consultas'
import { CriarCliente } from '#modulos/clientes/use-cases/criar-cliente'
import { CriarPeca } from '#modulos/estoque/use-cases/criar-peca'
import { ObterPeca } from '#modulos/estoque/use-cases/obter-peca'
import { prepararBanco } from '#tests/helpers/banco'
import { capturarErro } from '#tests/helpers/erros'
import { gerarCpf } from '#tests/helpers/dados'
import { RecursoNaoEncontrado, RegraDeNegocioViolada } from '#shared/entities/erros'
import { StatusOS } from '#modulos/ordens-servico/entities/objetos-de-valor/status-ordem-servico'

test.group('Casos de uso de OS — branches de erro', (group) => {
  prepararBanco(group)

  async function clienteEVeiculo() {
    const cliente = await executar(CriarCliente, { nome: 'Cli', documento: gerarCpf() })
    const veiculo = await executar(CriarVeiculo, {
      clienteId: cliente.id,
      placa: 'ABC1D23',
      marca: 'Fiat',
      modelo: 'Uno',
      ano: 2020,
    })
    return { clienteId: cliente.id, veiculoId: veiculo.id }
  }

  test('criar OS com serviço inexistente lança RecursoNaoEncontrado', async ({ assert }) => {
    const { clienteId, veiculoId } = await clienteEVeiculo()
    const erro = await capturarErro(async () =>
      executar(CriarOrdemServico, {
        clienteId,
        veiculoId,
        servicos: [{ servicoId: randomUUID(), quantidade: 1 }],
      })
    )
    assert.instanceOf(erro, RecursoNaoEncontrado)
  })

  test('criar OS com serviço inativo viola regra de negócio', async ({ assert }) => {
    const { clienteId, veiculoId } = await clienteEVeiculo()
    const servico = await executar(CriarServico, { nome: 'Inativo', preco: 100 })
    await executar(InativarServico, servico.id)
    const erro = await capturarErro(async () =>
      executar(CriarOrdemServico, {
        clienteId,
        veiculoId,
        servicos: [{ servicoId: servico.id, quantidade: 1 }],
      })
    )
    assert.instanceOf(erro, RegraDeNegocioViolada)
  })

  test('criar OS com peça inexistente lança RecursoNaoEncontrado', async ({ assert }) => {
    const { clienteId, veiculoId } = await clienteEVeiculo()
    const erro = await capturarErro(async () =>
      executar(CriarOrdemServico, {
        clienteId,
        veiculoId,
        pecas: [{ pecaId: randomUUID(), quantidade: 1 }],
      })
    )
    assert.instanceOf(erro, RecursoNaoEncontrado)
  })

  test('adicionar serviço inexistente a uma OS lança RecursoNaoEncontrado', async ({ assert }) => {
    const { clienteId, veiculoId } = await clienteEVeiculo()
    const os = await executar(CriarOrdemServico, { clienteId, veiculoId })
    const erro = await capturarErro(async () =>
      executar(AdicionarServicoNaOrdem, {
        ordemId: os.id,
        servicoId: randomUUID(),
        quantidade: 1,
      })
    )
    assert.instanceOf(erro, RecursoNaoEncontrado)
  })

  test('adicionar peça: OS e peça inexistentes lançam RecursoNaoEncontrado', async ({ assert }) => {
    assert.instanceOf(
      await capturarErro(async () =>
        executar(AdicionarPecaNaOrdem, {
          ordemId: randomUUID(),
          pecaId: randomUUID(),
          quantidade: 1,
        })
      ),
      RecursoNaoEncontrado
    )

    const { clienteId, veiculoId } = await clienteEVeiculo()
    const os = await executar(CriarOrdemServico, { clienteId, veiculoId })
    assert.instanceOf(
      await capturarErro(async () =>
        executar(AdicionarPecaNaOrdem, {
          ordemId: os.id,
          pecaId: randomUUID(),
          quantidade: 1,
        })
      ),
      RecursoNaoEncontrado
    )
  })

  test('consultar andamento e alterar status de OS inexistente lançam RecursoNaoEncontrado', async ({
    assert,
  }) => {
    assert.instanceOf(
      await capturarErro(async () => executar(ConsultarAndamento, randomUUID())),
      RecursoNaoEncontrado
    )
    assert.instanceOf(
      await capturarErro(async () =>
        executar(AlterarStatusDaOrdem, {
          ordemId: randomUUID(),
          novoStatus: StatusOS.EM_DIAGNOSTICO,
        })
      ),
      RecursoNaoEncontrado
    )
  })
  test('falha na reserva da segunda peça desfaz a reserva da primeira (rollback)', async ({
    assert,
  }) => {
    const { clienteId, veiculoId } = await clienteEVeiculo()
    const pecaA = await executar(CriarPeca, { nome: 'Filtro', preco: 30, quantidadeEstoque: 5 })
    const pecaB = await executar(CriarPeca, { nome: 'Correia', preco: 80, quantidadeEstoque: 1 })

    const erro = await capturarErro(async () =>
      executar(CriarOrdemServico, {
        clienteId,
        veiculoId,
        pecas: [
          { pecaId: pecaA.id, quantidade: 2 },
          { pecaId: pecaB.id, quantidade: 5 },
        ],
      })
    )
    assert.instanceOf(erro, RegraDeNegocioViolada)

    // A transação da Unidade de Trabalho desfaz a reserva da primeira peça.
    const recarregadaA = await executar(ObterPeca, pecaA.id)
    assert.equal(recarregadaA.quantidadeEstoque, 5)
  })
})
