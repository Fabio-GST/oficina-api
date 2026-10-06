import { test } from '@japa/runner'
import { Dinheiro } from '#shared/entities/objetos-de-valor/dinheiro'
import { Servico } from '#modulos/servicos/entities/servico'

function novoServico() {
  return Servico.criar({ nome: 'Troca de óleo', preco: Dinheiro.deReais(120) })
}

test.group('Servico (agregado)', () => {
  test('nasce ativo e registra evento servicos.cadastrado', ({ assert }) => {
    const servico = novoServico()
    assert.isTrue(servico.ativo)
    const eventos = servico.extrairEventos()
    assert.lengthOf(eventos, 1)
    assert.equal(eventos[0].nome, 'servicos.cadastrado')
  })

  test('inativar marca como inativo e registra evento servicos.inativado', ({ assert }) => {
    const servico = novoServico()
    servico.extrairEventos() // descarta o evento de criação
    servico.inativar()
    assert.isFalse(servico.ativo)
    const eventos = servico.extrairEventos()
    assert.lengthOf(eventos, 1)
    assert.equal(eventos[0].nome, 'servicos.inativado')
  })

  test('inativar é idempotente (não duplica evento)', ({ assert }) => {
    const servico = novoServico()
    servico.extrairEventos()
    servico.inativar()
    servico.extrairEventos()
    servico.inativar()
    assert.lengthOf(servico.extrairEventos(), 0)
  })

  test('serviço inativo não pode ser alterado', ({ assert }) => {
    const servico = novoServico()
    servico.inativar()
    assert.throws(() => servico.atualizar({ nome: 'Novo nome' }))
    assert.throws(() => servico.atualizarPreco(Dinheiro.deReais(200)))
    assert.throws(() => servico.definirTempoEstimado(30))
  })

  test('atualizar preço registra servicos.preco-atualizado', ({ assert }) => {
    const servico = novoServico()
    servico.extrairEventos()
    servico.atualizarPreco(Dinheiro.deReais(150))
    assert.equal(servico.preco.reais, 150)
    const eventos = servico.extrairEventos()
    assert.equal(eventos[0].nome, 'servicos.preco-atualizado')
  })

  test('definir tempo estimado exige inteiro positivo', ({ assert }) => {
    const servico = novoServico()
    servico.definirTempoEstimado(45)
    assert.equal(servico.tempoEstimadoMinutos, 45)
    assert.throws(() => servico.definirTempoEstimado(0))
    assert.throws(() => servico.definirTempoEstimado(1.5))
  })

  test('reativar permite alterar novamente', ({ assert }) => {
    const servico = novoServico()
    servico.inativar()
    servico.reativar()
    assert.isTrue(servico.ativo)
    servico.atualizar({ nome: 'Troca de óleo sintético' })
    assert.equal(servico.nome, 'Troca de óleo sintético')
  })
})
