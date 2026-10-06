import { test } from '@japa/runner'
import { Dinheiro } from '#shared/entities/objetos-de-valor/dinheiro'
import { OrdemServico } from '#modulos/ordens-servico/entities/ordem-servico'
import { StatusOS } from '#modulos/ordens-servico/entities/objetos-de-valor/status-ordem-servico'

function novaOrdem() {
  return OrdemServico.criar({ clienteId: 'cliente-1', veiculoId: 'veiculo-1' })
}

test.group('OrdemServico (agregado)', () => {
  test('nasce no status RECEBIDA com orçamento zero', ({ assert }) => {
    const ordem = novaOrdem()
    assert.equal(ordem.status.valor, StatusOS.RECEBIDA)
    assert.equal(ordem.orcamento().centavos, 0)
    assert.lengthOf(ordem.historico, 1)
  })

  test('compõe o orçamento somando serviços e peças', ({ assert }) => {
    const ordem = novaOrdem()
    ordem.adicionarServico({
      servicoId: 's1',
      descricao: 'Troca de óleo',
      precoUnitario: Dinheiro.deReais(120),
      quantidade: 1,
    })
    ordem.adicionarPeca({
      pecaId: 'p1',
      descricao: 'Óleo 5W30',
      precoUnitario: Dinheiro.deReais(45),
      quantidade: 4,
    })
    // 120 + (45 * 4) = 300
    assert.equal(ordem.orcamento().reais, 300)
    assert.lengthOf(ordem.itens, 2)
  })

  test('aprova a OS apenas quando aguardando aprovação', ({ assert }) => {
    const ordem = novaOrdem()
    ordem.adicionarServico({
      servicoId: 's1',
      descricao: 'Serviço',
      precoUnitario: Dinheiro.deReais(100),
      quantidade: 1,
    })
    assert.throws(() => ordem.aprovar()) // ainda em RECEBIDA

    ordem.transitarPara(StatusOS.EM_DIAGNOSTICO)
    ordem.transitarPara(StatusOS.AGUARDANDO_APROVACAO)
    ordem.aprovar()

    assert.equal(ordem.status.valor, StatusOS.EM_EXECUCAO)
    assert.isAbove(ordem.extrairEventos().length, 0)
  })

  test('não permite adicionar itens após sair da fase editável', ({ assert }) => {
    const ordem = novaOrdem()
    ordem.adicionarServico({
      servicoId: 's1',
      descricao: 'Serviço',
      precoUnitario: Dinheiro.deReais(100),
      quantidade: 1,
    })
    ordem.transitarPara(StatusOS.EM_DIAGNOSTICO)
    ordem.transitarPara(StatusOS.AGUARDANDO_APROVACAO)
    ordem.aprovar() // EM_EXECUCAO

    assert.throws(() =>
      ordem.adicionarServico({
        servicoId: 's2',
        descricao: 'Outro',
        precoUnitario: Dinheiro.deReais(50),
        quantidade: 1,
      })
    )
  })

  test('fluxo completo via comandos emite os eventos do ciclo de vida', ({ assert }) => {
    const ordem = novaOrdem()
    ordem.extrairEventos() // descarta ordem-servico.aberta
    ordem.adicionarServico({
      servicoId: 's1',
      descricao: 'Serviço',
      precoUnitario: Dinheiro.deReais(100),
      quantidade: 1,
    })
    ordem.iniciarDiagnostico()
    ordem.gerarOrcamento()
    ordem.aprovar()
    ordem.finalizar()
    ordem.entregar()
    const nomes = ordem.extrairEventos().map((e) => e.nome)
    assert.deepEqual(nomes, [
      'ordem-servico.diagnostico-iniciado',
      'ordem-servico.orcamento-gerado',
      'ordem-servico.aprovada',
      'ordem-servico.finalizada',
      'ordem-servico.veiculo-entregue',
    ])
    assert.equal(ordem.status.valor, StatusOS.ENTREGUE)
  })

  test('recusa leva a OS para RECUSADA e emite evento', ({ assert }) => {
    const ordem = novaOrdem()
    ordem.adicionarServico({
      servicoId: 's1',
      descricao: 'Serviço',
      precoUnitario: Dinheiro.deReais(100),
      quantidade: 1,
    })
    ordem.iniciarDiagnostico()
    ordem.gerarOrcamento()
    ordem.extrairEventos()
    ordem.recusar()
    assert.equal(ordem.status.valor, StatusOS.RECUSADA)
    assert.equal(ordem.extrairEventos()[0].nome, 'ordem-servico.recusada')
  })

  test('renegociação volta para EM_DIAGNOSTICO e reabre a edição', ({ assert }) => {
    const ordem = novaOrdem()
    ordem.adicionarServico({
      servicoId: 's1',
      descricao: 'Serviço',
      precoUnitario: Dinheiro.deReais(100),
      quantidade: 1,
    })
    ordem.iniciarDiagnostico()
    ordem.gerarOrcamento()
    ordem.renegociar()
    assert.equal(ordem.status.valor, StatusOS.EM_DIAGNOSTICO)
    // edição reaberta: consegue adicionar novo item
    ordem.adicionarServico({
      servicoId: 's2',
      descricao: 'Outro',
      precoUnitario: Dinheiro.deReais(50),
      quantidade: 1,
    })
    assert.lengthOf(ordem.itens, 2)
  })

  test('não gera orçamento sem itens', ({ assert }) => {
    const ordem = novaOrdem()
    ordem.iniciarDiagnostico()
    assert.throws(() => ordem.gerarOrcamento())
  })

  test('calcula a duração de execução após finalizar', ({ assert }) => {
    const ordem = novaOrdem()
    assert.isNull(ordem.duracaoExecucaoMinutos())

    ordem.adicionarServico({
      servicoId: 's1',
      descricao: 'Serviço',
      precoUnitario: Dinheiro.deReais(100),
      quantidade: 1,
    })
    ordem.transitarPara(StatusOS.EM_DIAGNOSTICO)
    ordem.transitarPara(StatusOS.AGUARDANDO_APROVACAO)
    ordem.transitarPara(StatusOS.EM_EXECUCAO)
    ordem.transitarPara(StatusOS.FINALIZADA)

    const duracao = ordem.duracaoExecucaoMinutos()
    assert.isNotNull(duracao)
    assert.isAtLeast(duracao as number, 0)
  })
})
