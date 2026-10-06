import { test } from '@japa/runner'
import { BarramentoDeEventos } from '#shared/frameworks-drivers/eventos/barramento-de-eventos'
import type { EventoDeDominio } from '#shared/entities/evento-de-dominio'
import type { ManipuladorDeEvento } from '#shared/use-cases/manipulador-de-evento'

class EventoFake implements EventoDeDominio {
  readonly nome = 'teste.aconteceu'
  readonly ocorridoEm = new Date()
  constructor(readonly carga: string) {}
}

test.group('BarramentoDeEventos', () => {
  test('entrega o evento aos manipuladores inscritos no seu nome', async ({ assert }) => {
    const barramento = new BarramentoDeEventos()
    const recebidos: string[] = []
    const manipulador: ManipuladorDeEvento<EventoFake> = {
      evento: 'teste.aconteceu',
      async manipular(evento) {
        recebidos.push(evento.carga)
      },
    }
    barramento.registrar(manipulador)

    await barramento.publicar([new EventoFake('a'), new EventoFake('b')])

    assert.deepEqual(recebidos, ['a', 'b'])
  })

  test('não entrega a manipuladores de outros eventos', async ({ assert }) => {
    const barramento = new BarramentoDeEventos()
    let chamado = false
    barramento.registrar({
      evento: 'outro.evento',
      async manipular() {
        chamado = true
      },
    })

    await barramento.publicar([new EventoFake('x')])

    assert.isFalse(chamado)
  })

  test('isola falha de um manipulador e segue para os demais', async ({ assert }) => {
    const barramento = new BarramentoDeEventos()
    let segundoChamado = false
    barramento.registrar({
      evento: 'teste.aconteceu',
      async manipular() {
        throw new Error('falha proposital')
      },
    })
    barramento.registrar({
      evento: 'teste.aconteceu',
      async manipular() {
        segundoChamado = true
      },
    })

    await barramento.publicar([new EventoFake('x')])

    assert.isTrue(segundoChamado)
  })

  test('limpar remove todos os manipuladores', async ({ assert }) => {
    const barramento = new BarramentoDeEventos()
    let chamado = false
    barramento.registrar({
      evento: 'teste.aconteceu',
      async manipular() {
        chamado = true
      },
    })
    barramento.limpar()

    await barramento.publicar([new EventoFake('x')])

    assert.isFalse(chamado)
  })
})
