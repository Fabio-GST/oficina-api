import { test } from '@japa/runner'
import { prepararBanco } from '#tests/helpers/banco'
import { Dinheiro } from '#shared/entities/objetos-de-valor/dinheiro'
import { Servico } from '#modulos/servicos/entities/servico'
import { RepositorioDeServicosLucid } from '#modulos/servicos/interface-adapters/gateways/repositorio-de-servicos-lucid'

test.group('RepositorioDeServicosLucid', (group) => {
  prepararBanco(group)
  const repositorio = new RepositorioDeServicosLucid()

  function novoServico(nome = 'Troca de óleo') {
    return Servico.criar({
      nome,
      descricao: 'Inclui filtro',
      preco: Dinheiro.deReais(120),
      tempoEstimadoMinutos: 30,
    })
  }

  test('salva e recupera um serviço por id', async ({ assert }) => {
    const servico = novoServico()
    await repositorio.salvar(servico)

    const recuperado = await repositorio.buscarPorId(servico.id)
    assert.exists(recuperado)
    assert.equal(recuperado!.nome, 'Troca de óleo')
    assert.equal(recuperado!.descricao, 'Inclui filtro')
    assert.equal(recuperado!.preco.centavos, 12000)
    assert.equal(recuperado!.tempoEstimadoMinutos, 30)
    assert.isTrue(recuperado!.ativo)
  })

  test('persiste a inativação e a atualização de preço', async ({ assert }) => {
    const servico = novoServico()
    await repositorio.salvar(servico)

    servico.atualizarPreco(Dinheiro.deReais(150))
    servico.inativar()
    await repositorio.salvar(servico)

    const recuperado = await repositorio.buscarPorId(servico.id)
    assert.equal(recuperado!.preco.centavos, 15000)
    assert.isFalse(recuperado!.ativo)
  })

  test('buscarVarios retorna apenas os ids pedidos', async ({ assert }) => {
    const a = novoServico('A')
    const b = novoServico('B')
    const c = novoServico('C')
    await repositorio.salvar(a)
    await repositorio.salvar(b)
    await repositorio.salvar(c)

    const varios = await repositorio.buscarVarios([a.id, c.id])
    const nomes = varios.map((s) => s.nome).sort()
    assert.deepEqual(nomes, ['A', 'C'])
  })

  test('lista e remove serviços', async ({ assert }) => {
    const servico = novoServico()
    await repositorio.salvar(servico)
    assert.lengthOf(await repositorio.listar(), 1)

    await repositorio.remover(servico.id)
    assert.lengthOf(await repositorio.listar(), 0)
  })

  test('buscarPorId inexistente retorna null', async ({ assert }) => {
    assert.isNull(await repositorio.buscarPorId('nao-existe'))
  })
})
