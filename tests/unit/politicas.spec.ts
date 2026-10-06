import { test } from '@japa/runner'
import type { OrdemServicoDTO } from '#modulos/ordens-servico/use-cases/dtos'
import { OrdemServicoAprovada } from '#modulos/ordens-servico/entities/eventos/ordem-servico-aprovada'
import { OrdemServicoRecusada } from '#modulos/ordens-servico/entities/eventos/ordem-servico-recusada'
import { EstoqueAbaixoDoMinimo } from '#modulos/estoque/entities/eventos/estoque-abaixo-do-minimo'
import { PagamentoConfirmado } from '#modulos/pagamento/entities/eventos/pagamento-confirmado'
import { UtilizarPecasAoAprovar } from '#politicas/utilizar-pecas-ao-aprovar'
import { LiberarReservaAoRecusar } from '#politicas/liberar-reserva-ao-recusar'
import { EmitirNotaAoConfirmarPagamento } from '#politicas/emitir-nota-ao-confirmar-pagamento'
import { SolicitarCompraAoAtingirMinimo } from '#politicas/solicitar-compra-ao-atingir-minimo'

function ordemFake(itens: OrdemServicoDTO['itens']): OrdemServicoDTO {
  return {
    id: 'os-1',
    clienteId: 'c-1',
    veiculoId: 'v-1',
    status: 'EM_EXECUCAO',
    prioridade: 'NORMAL',
    orcamento: 100,
    itens,
    historico: [],
    criadaEm: '2026-01-01T00:00:00.000Z',
  }
}

const notificacaoFake = {
  async notificarCliente() {},
  async notificarAlmoxarife() {},
}

test.group('Políticas inter-domínio', () => {
  test('aprovar OS utiliza apenas as peças (não serviços)', async ({ assert }) => {
    const utilizadas: { id: string; quantidade: number }[] = []
    const politica = new UtilizarPecasAoAprovar(
      async () =>
        ordemFake([
          {
            id: 'i1',
            tipo: 'PECA',
            referenciaId: 'p1',
            descricao: 'Óleo',
            precoUnitario: 45,
            quantidade: 2,
            subtotal: 90,
          },
          {
            id: 'i2',
            tipo: 'SERVICO',
            referenciaId: 's1',
            descricao: 'Troca',
            precoUnitario: 100,
            quantidade: 1,
            subtotal: 100,
          },
        ]),
      async (e) => {
        utilizadas.push(e)
      }
    )

    await politica.manipular(new OrdemServicoAprovada('os-1'))

    assert.deepEqual(utilizadas, [{ id: 'p1', quantidade: 2 }])
  })

  test('recusar OS libera as reservas das peças', async ({ assert }) => {
    const liberadas: { id: string; quantidade: number }[] = []
    const politica = new LiberarReservaAoRecusar(
      async () =>
        ordemFake([
          {
            id: 'i1',
            tipo: 'PECA',
            referenciaId: 'p1',
            descricao: 'Óleo',
            precoUnitario: 45,
            quantidade: 3,
            subtotal: 135,
          },
        ]),
      async (e) => {
        liberadas.push(e)
      }
    )

    await politica.manipular(new OrdemServicoRecusada('os-1'))

    assert.deepEqual(liberadas, [{ id: 'p1', quantidade: 3 }])
  })

  test('pagamento confirmado emite a nota fiscal do pagamento', async ({ assert }) => {
    let emitido: string | null = null
    const politica = new EmitirNotaAoConfirmarPagamento(async (id) => {
      emitido = id
    })

    await politica.manipular(new PagamentoConfirmado('pag-1', 'os-1', 15000))

    assert.equal(emitido, 'pag-1')
  })

  test('estoque abaixo do mínimo solicita compra repondo até o dobro do mínimo', async ({
    assert,
  }) => {
    const compras: { pecaId: string; quantidade: number }[] = []
    const politica = new SolicitarCompraAoAtingirMinimo(async (e) => {
      compras.push(e)
    }, notificacaoFake)

    // disponível 1, mínimo 4 → repõe 4*2 - 1 = 7
    await politica.manipular(new EstoqueAbaixoDoMinimo('p1', 1, 4))

    assert.deepEqual(compras, [{ pecaId: 'p1', quantidade: 7 }])
  })
})
