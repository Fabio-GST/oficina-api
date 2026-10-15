import { test } from '@japa/runner'
import type { Transporter } from 'nodemailer'
import { HttpContextFactory } from '@adonisjs/core/factories/http'
import {
  descreverErro,
  TelemetriaNula,
  type AtributosDeTelemetria,
  type NomeEventoDeTelemetria,
  type Telemetria,
} from '#shared/use-cases/telemetria'
import { ServicoDeNotificacaoEmail } from '#shared/frameworks-drivers/notificacao/servico-de-notificacao-email'
import { OrdemServicoAberta } from '#modulos/ordens-servico/entities/eventos/ordem-servico-aberta'
import { OrdemServicoAprovada } from '#modulos/ordens-servico/entities/eventos/ordem-servico-aprovada'
import type { OrdemServicoDTO } from '#modulos/ordens-servico/use-cases/dtos'
import {
  RegistrarCriacaoDaOS,
  RegistrarMudancaDeStatusDaOS,
} from '#politicas/registrar-telemetria-da-os'
import SegredoWebhookMiddleware from '#middleware/segredo_webhook_middleware'

interface EventoRegistrado {
  nome: NomeEventoDeTelemetria
  atributos: AtributosDeTelemetria
}

/** Telemetria fake: guarda os eventos em memória para asserção. */
function telemetriaFake() {
  const eventos: EventoRegistrado[] = []
  const telemetria: Telemetria = {
    registrarEvento(nome, atributos) {
      eventos.push({ nome, atributos })
    },
  }
  return { telemetria, eventos }
}

function ordemFake(historico: OrdemServicoDTO['historico']): OrdemServicoDTO {
  return {
    id: 'os-1',
    clienteId: 'c-1',
    veiculoId: 'v-1',
    status: historico.at(-1)?.status ?? 'RECEBIDA',
    prioridade: 'NORMAL',
    orcamento: 0,
    itens: [],
    historico,
    criadaEm: '2026-01-01T00:00:00.000Z',
  }
}

test.group('Telemetria: porta e utilitários', () => {
  test('TelemetriaNula descarta os eventos sem falhar', ({ assert }) => {
    const nula = new TelemetriaNula()
    assert.doesNotThrow(() => nula.registrarEvento('OrdemServicoCriada', { ordemServicoId: 'x' }))
  })

  test('descreverErro resume Error e valores arbitrários', ({ assert }) => {
    assert.equal(descreverErro(new TypeError('boom')), 'TypeError: boom')
    assert.equal(descreverErro('texto'), 'texto')
  })
})

test.group('Políticas de telemetria da OS', () => {
  test('OS aberta registra OrdemServicoCriada com os ids', async ({ assert }) => {
    const { telemetria, eventos } = telemetriaFake()
    const politica = new RegistrarCriacaoDaOS(telemetria)

    assert.equal(politica.evento, 'ordem-servico.aberta')
    await politica.manipular(new OrdemServicoAberta('os-1', 'c-1', 'v-1'))

    assert.deepEqual(eventos, [
      {
        nome: 'OrdemServicoCriada',
        atributos: { ordemServicoId: 'os-1', clienteId: 'c-1', veiculoId: 'v-1' },
      },
    ])
  })

  test('transição registra OrdemServicoMudouStatus com de/para/duracaoMs do histórico', async ({
    assert,
  }) => {
    const { telemetria, eventos } = telemetriaFake()
    const politica = new RegistrarMudancaDeStatusDaOS(
      'ordem-servico.aprovada',
      async () =>
        ordemFake([
          { status: 'RECEBIDA', ocorridoEm: '2026-01-01T10:00:00.000Z' },
          { status: 'EM_DIAGNOSTICO', ocorridoEm: '2026-01-01T10:05:00.000Z' },
          { status: 'AGUARDANDO_APROVACAO', ocorridoEm: '2026-01-01T10:30:00.000Z' },
          { status: 'EM_EXECUCAO', ocorridoEm: '2026-01-01T11:00:00.000Z' },
        ]),
      telemetria
    )

    assert.equal(politica.evento, 'ordem-servico.aprovada')
    await politica.manipular(new OrdemServicoAprovada('os-1'))

    assert.deepEqual(eventos, [
      {
        nome: 'OrdemServicoMudouStatus',
        atributos: {
          ordemServicoId: 'os-1',
          de: 'AGUARDANDO_APROVACAO',
          para: 'EM_EXECUCAO',
          duracaoMs: 30 * 60 * 1000,
        },
      },
    ])
  })

  test('sem transição anterior no histórico, não registra nada', async ({ assert }) => {
    const { telemetria, eventos } = telemetriaFake()
    const politica = new RegistrarMudancaDeStatusDaOS(
      'ordem-servico.diagnostico-iniciado',
      async () => ordemFake([{ status: 'RECEBIDA', ocorridoEm: '2026-01-01T10:00:00.000Z' }]),
      telemetria
    )

    await politica.manipular(new OrdemServicoAprovada('os-1'))

    assert.lengthOf(eventos, 0)
  })

  test('datas inválidas no histórico resultam em duracaoMs 0', async ({ assert }) => {
    const { telemetria, eventos } = telemetriaFake()
    const politica = new RegistrarMudancaDeStatusDaOS(
      'ordem-servico.finalizada',
      async () =>
        ordemFake([
          { status: 'EM_EXECUCAO', ocorridoEm: '' },
          { status: 'FINALIZADA', ocorridoEm: '2026-01-01T11:00:00.000Z' },
        ]),
      telemetria
    )

    await politica.manipular(new OrdemServicoAprovada('os-1'))

    assert.equal(eventos[0].atributos.duracaoMs, 0)
  })
})

test.group('Telemetria: falhas de integração', () => {
  test('falha no SMTP registra IntegracaoFalhou { integracao: email }', async ({ assert }) => {
    const { telemetria, eventos } = telemetriaFake()
    const transporte = {
      sendMail: async () => {
        throw new Error('SMTP indisponível')
      },
    } as unknown as Transporter
    const servico = new ServicoDeNotificacaoEmail(
      transporte,
      { remetente: 'oficina@teste.com' },
      telemetria
    )

    await servico.notificarCliente('Olá', { destinatarioEmail: 'maria@teste.com' })

    assert.lengthOf(eventos, 1)
    assert.equal(eventos[0].nome, 'IntegracaoFalhou')
    assert.equal(eventos[0].atributos.integracao, 'email')
    assert.equal(eventos[0].atributos.erro, 'Error: SMTP indisponível')
  })

  test('e-mail enviado com sucesso não registra falha', async ({ assert }) => {
    const { telemetria, eventos } = telemetriaFake()
    const transporte = { sendMail: async () => {} } as unknown as Transporter
    const servico = new ServicoDeNotificacaoEmail(
      transporte,
      { remetente: 'oficina@teste.com' },
      telemetria
    )

    await servico.notificarCliente('Olá', { destinatarioEmail: 'maria@teste.com' })

    assert.lengthOf(eventos, 0)
  })

  test('webhook com token inválido registra IntegracaoFalhou { integracao: webhook } e propaga', async ({
    assert,
  }) => {
    const { telemetria, eventos } = telemetriaFake()
    const middleware = new SegredoWebhookMiddleware(telemetria)
    const ctx = new HttpContextFactory().create()
    ctx.request.request.headers['x-webhook-token'] = 'errado'

    await assert.rejects(() => middleware.handle(ctx, async () => {}), /Token de webhook/)

    assert.lengthOf(eventos, 1)
    assert.equal(eventos[0].nome, 'IntegracaoFalhou')
    assert.equal(eventos[0].atributos.integracao, 'webhook')
    assert.match(String(eventos[0].atributos.erro), /NaoAutenticado|Token de webhook/)
  })

  test('webhook cujo processamento falha registra a falha e propaga o erro', async ({ assert }) => {
    const { telemetria, eventos } = telemetriaFake()
    const middleware = new SegredoWebhookMiddleware(telemetria)
    const ctx = new HttpContextFactory().create()
    ctx.request.request.headers['x-webhook-token'] = 'test-webhook-secret'

    await assert.rejects(
      () =>
        middleware.handle(ctx, async () => {
          throw new Error('banco indisponível')
        }),
      /banco indisponível/
    )

    assert.lengthOf(eventos, 1)
    assert.equal(eventos[0].atributos.erro, 'Error: banco indisponível')
  })

  test('webhook válido e bem-sucedido não registra falha', async ({ assert }) => {
    const { telemetria, eventos } = telemetriaFake()
    const middleware = new SegredoWebhookMiddleware(telemetria)
    const ctx = new HttpContextFactory().create()
    ctx.request.request.headers['x-webhook-token'] = 'test-webhook-secret'

    await middleware.handle(ctx, async () => {})

    assert.lengthOf(eventos, 0)
  })
})
