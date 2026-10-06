import { test } from '@japa/runner'
import type { ServicoDeNotificacao } from '#shared/use-cases/servico-de-notificacao'
import { GerarCobrancaAoFinalizar } from '#politicas/gerar-cobranca-ao-finalizar'
import { NotificarClienteSobreOS } from '#politicas/notificar-cliente-sobre-os'
import { ServicoDeNotificacaoLog } from '#shared/frameworks-drivers/notificacao/servico-de-notificacao-log'

/** Espião do serviço de notificação. */
function notificacaoFake() {
  const chamadas: { mensagem: string; contexto?: Record<string, unknown> }[] = []
  const servico: ServicoDeNotificacao = {
    async notificarCliente(mensagem, contexto) {
      chamadas.push({ mensagem, contexto })
    },
    async notificarAlmoxarife(mensagem, contexto) {
      chamadas.push({ mensagem, contexto })
    },
  }
  return { servico, chamadas }
}

test.group('Política: gerar cobrança ao finalizar', () => {
  test('gera cobrança quando há orçamento e notifica o cliente', async ({ assert }) => {
    const { servico, chamadas } = notificacaoFake()
    const cobrancas: { ordemId: string; total: number }[] = []
    const politica = new GerarCobrancaAoFinalizar(
      async () => ({ id: 'os1', clienteId: 'c1', orcamento: 210 }) as any,
      async (entrada) => {
        cobrancas.push(entrada)
      },
      servico
    )

    await politica.manipular({ ordemServicoId: 'os1' } as any)

    assert.deepEqual(cobrancas, [{ ordemId: 'os1', total: 210 }])
    assert.lengthOf(chamadas, 1)
  })

  test('não gera cobrança quando o orçamento é zero, mas ainda notifica', async ({ assert }) => {
    const { servico, chamadas } = notificacaoFake()
    let gerou = false
    const politica = new GerarCobrancaAoFinalizar(
      async () => ({ id: 'os1', clienteId: 'c1', orcamento: 0 }) as any,
      async () => {
        gerou = true
      },
      servico
    )

    await politica.manipular({ ordemServicoId: 'os1' } as any)

    assert.isFalse(gerou)
    assert.lengthOf(chamadas, 1)
  })
})

test.group('Política: notificar cliente sobre a OS', () => {
  test('dispara notificação com o id da OS', async ({ assert }) => {
    const { servico, chamadas } = notificacaoFake()
    const politica = new NotificarClienteSobreOS(
      'ordem-servico.aprovada',
      'Sua OS foi aprovada.',
      servico
    )

    assert.equal(politica.evento, 'ordem-servico.aprovada')
    await politica.manipular({ ordemServicoId: 'os1' } as any)

    assert.equal(chamadas[0].mensagem, 'Sua OS foi aprovada.')
    assert.equal(chamadas[0].contexto?.ordemServicoId, 'os1')
  })
})

test.group('Serviço de notificação (stub de log)', () => {
  test('notifica cliente e almoxarife sem lançar', async ({ assert }) => {
    const servico = new ServicoDeNotificacaoLog()
    await servico.notificarCliente('oi', { ordemServicoId: 'os1' })
    await servico.notificarAlmoxarife('repor', { pecaId: 'p1' })
    assert.isTrue(true)
  })
})
