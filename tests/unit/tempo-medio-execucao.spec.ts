import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import { CalcularTempoMedioExecucao } from '#modulos/ordens-servico/use-cases/consultas'
import { OrdemServico } from '#modulos/ordens-servico/entities/ordem-servico'
import {
  StatusOrdemServico,
  StatusOS,
} from '#modulos/ordens-servico/entities/objetos-de-valor/status-ordem-servico'
import { PrioridadeOS } from '#modulos/ordens-servico/entities/objetos-de-valor/prioridade-os'
import type { RepositorioDeOrdensServico } from '#modulos/ordens-servico/use-cases/ports/repositorio-de-ordens-servico'

class OrdensMemoria implements RepositorioDeOrdensServico {
  constructor(private readonly itens: OrdemServico[]) {}
  async salvar() {}
  async buscarPorId() {
    return null
  }
  async listar() {
    return this.itens
  }
}

/** Reconstitui uma OS finalizada com janela de execução conhecida. */
function osFinalizada(inicio: DateTime, minutos: number) {
  return OrdemServico.reconstituir({
    id: `os-${minutos}`,
    clienteId: 'c1',
    veiculoId: 'v1',
    status: StatusOrdemServico.criar(StatusOS.FINALIZADA),
    prioridade: PrioridadeOS.NORMAL,
    itens: [],
    historico: [
      { status: StatusOS.EM_EXECUCAO, ocorridoEm: inicio },
      { status: StatusOS.FINALIZADA, ocorridoEm: inicio.plus({ minutes: minutos }) },
    ],
    criadaEm: inicio,
  })
}

test.group('CalcularTempoMedioExecucao', () => {
  test('calcula a média das durações (EM_EXECUCAO → FINALIZADA)', async ({ assert }) => {
    const base = DateTime.fromISO('2026-01-01T10:00:00')
    const repo = new OrdensMemoria([osFinalizada(base, 20), osFinalizada(base, 40)])

    const resultado = await new CalcularTempoMedioExecucao(repo).executar()

    assert.equal(resultado.tempoMedioMinutos, 30)
    assert.equal(resultado.ordensConsideradas, 2)
  })

  test('retorna nulo quando não há OS com execução concluída', async ({ assert }) => {
    const resultado = await new CalcularTempoMedioExecucao(new OrdensMemoria([])).executar()
    assert.isNull(resultado.tempoMedioMinutos)
    assert.equal(resultado.ordensConsideradas, 0)
  })
})
