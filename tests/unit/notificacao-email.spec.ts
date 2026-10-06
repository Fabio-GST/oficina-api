import { test } from '@japa/runner'
import type { Transporter } from 'nodemailer'
import { ServicoDeNotificacaoEmail } from '#shared/frameworks-drivers/notificacao/servico-de-notificacao-email'
import { NotificarClienteSobreOS } from '#politicas/notificar-cliente-sobre-os'
import type { EventoDeDominio } from '#shared/entities/evento-de-dominio'

interface EmailEnviado {
  from: string
  to: string
  subject: string
  text: string
}

/** Transporte fake: captura os envios sem tocar em SMTP real. */
function transporteFake(falhar = false) {
  const enviados: EmailEnviado[] = []
  const transporte = {
    sendMail: async (mensagem: EmailEnviado) => {
      if (falhar) throw new Error('SMTP indisponível')
      enviados.push(mensagem)
    },
  } as unknown as Transporter
  return { transporte, enviados }
}

test.group('ServicoDeNotificacaoEmail', () => {
  test('envia e-mail ao cliente usando o destinatário do contexto', async ({ assert }) => {
    const { transporte, enviados } = transporteFake()
    const servico = new ServicoDeNotificacaoEmail(transporte, { remetente: 'oficina@teste.com' })

    await servico.notificarCliente('Seu orçamento está pronto.', {
      destinatarioEmail: 'maria@teste.com',
      destinatarioNome: 'Maria',
    })

    assert.lengthOf(enviados, 1)
    assert.equal(enviados[0].to, 'maria@teste.com')
    assert.equal(enviados[0].from, 'oficina@teste.com')
    assert.equal(enviados[0].text, 'Seu orçamento está pronto.')
  })

  test('sem destinatário conhecido, não envia (apenas registra em log)', async ({ assert }) => {
    const { transporte, enviados } = transporteFake()
    const servico = new ServicoDeNotificacaoEmail(transporte, { remetente: 'oficina@teste.com' })

    await servico.notificarCliente('Mensagem sem destinatário.')

    assert.lengthOf(enviados, 0)
  })

  test('falha no envio não propaga (notificação não derruba o fluxo)', async () => {
    const { transporte } = transporteFake(true)
    const servico = new ServicoDeNotificacaoEmail(transporte, { remetente: 'oficina@teste.com' })

    // Não deve lançar.
    await servico.notificarCliente('Qualquer mensagem.', {
      destinatarioEmail: 'maria@teste.com',
    })
  })

  test('alerta do almoxarife vai para o e-mail configurado', async ({ assert }) => {
    const { transporte, enviados } = transporteFake()
    const servico = new ServicoDeNotificacaoEmail(transporte, {
      remetente: 'oficina@teste.com',
      emailAlmoxarife: 'almoxarife@teste.com',
    })

    await servico.notificarAlmoxarife('Estoque abaixo do mínimo.')

    assert.lengthOf(enviados, 1)
    assert.equal(enviados[0].to, 'almoxarife@teste.com')
  })
})

test.group('NotificarClienteSobreOS com destinatário', () => {
  test('enriquece a notificação com nome e e-mail do cliente da OS', async ({ assert }) => {
    const notificacoes: { mensagem: string; contexto?: Record<string, unknown> }[] = []
    const notificacao = {
      notificarCliente: async (mensagem: string, contexto?: Record<string, unknown>) => {
        notificacoes.push({ mensagem, contexto })
      },
      notificarAlmoxarife: async () => {},
    }

    const politica = new NotificarClienteSobreOS(
      'ordem-servico.aprovada',
      'Aprovado!',
      notificacao,
      async (ordemId) => (ordemId === 'os-1' ? { nome: 'Maria', email: 'maria@teste.com' } : null)
    )

    const evento = {
      nome: 'ordem-servico.aprovada',
      ocorridoEm: new Date(),
      ordemServicoId: 'os-1',
    } satisfies EventoDeDominio & { ordemServicoId: string }

    await politica.manipular(evento)

    assert.lengthOf(notificacoes, 1)
    assert.equal(notificacoes[0].contexto?.destinatarioEmail, 'maria@teste.com')
    assert.equal(notificacoes[0].contexto?.destinatarioNome, 'Maria')
  })
})
