import { test } from '@japa/runner'
import {
  StatusOrdemServico,
  StatusOS,
} from '#modulos/ordens-servico/entities/objetos-de-valor/status-ordem-servico'

test.group('StatusOrdemServico (máquina de estados)', () => {
  test('o status inicial é RECEBIDA', ({ assert }) => {
    assert.equal(StatusOrdemServico.inicial().valor, StatusOS.RECEBIDA)
  })

  test('permite a transição prevista', ({ assert }) => {
    const status = StatusOrdemServico.inicial().transitarPara(StatusOS.EM_DIAGNOSTICO)
    assert.equal(status.valor, StatusOS.EM_DIAGNOSTICO)
  })

  test('rejeita transição não prevista', ({ assert }) => {
    assert.throws(() => StatusOrdemServico.inicial().transitarPara(StatusOS.ENTREGUE))
  })

  test('percorre todo o ciclo de vida até ENTREGUE', ({ assert }) => {
    let status = StatusOrdemServico.inicial()
    const fluxo = [
      StatusOS.EM_DIAGNOSTICO,
      StatusOS.AGUARDANDO_APROVACAO,
      StatusOS.EM_EXECUCAO,
      StatusOS.FINALIZADA,
      StatusOS.ENTREGUE,
    ]
    for (const proximo of fluxo) {
      status = status.transitarPara(proximo)
    }
    assert.equal(status.valor, StatusOS.ENTREGUE)
  })

  test('ENTREGUE é estado final (sem transições)', ({ assert }) => {
    const status = StatusOrdemServico.criar(StatusOS.ENTREGUE)
    assert.isFalse(status.podeTransitarPara(StatusOS.FINALIZADA))
  })
})
