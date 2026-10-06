import { test } from '@japa/runner'
import { prepararBanco } from '#tests/helpers/banco'
import { Cliente } from '#modulos/clientes/entities/cliente'
import { Documento } from '#modulos/clientes/entities/objetos-de-valor/documento'
import { RepositorioDeClientesLucid } from '#modulos/clientes/interface-adapters/gateways/repositorio-de-clientes-lucid'

/**
 * Teste de integração: exercita o repositório Lucid contra o banco de teste
 * (SQLite em memória). Valida o mapeamento de ida e volta domínio <-> persistência.
 */
test.group('RepositorioDeClientesLucid', (group) => {
  prepararBanco(group)
  const repositorio = new RepositorioDeClientesLucid()

  test('salva e recupera um cliente por id', async ({ assert }) => {
    const cliente = Cliente.criar({
      nome: 'Maria Silva',
      documento: Documento.criar('11144477735'),
      telefone: '11999998888',
      email: 'maria@exemplo.com',
    })

    await repositorio.salvar(cliente)
    const recuperado = await repositorio.buscarPorId(cliente.id)

    assert.exists(recuperado)
    assert.equal(recuperado!.id, cliente.id)
    assert.equal(recuperado!.nome, 'Maria Silva')
    assert.equal(recuperado!.documento.valor, '11144477735')
    assert.equal(recuperado!.documento.tipo, 'CPF')
    assert.equal(recuperado!.telefone, '11999998888')
    assert.equal(recuperado!.email, 'maria@exemplo.com')
  })

  test('busca por documento e confirma existência', async ({ assert }) => {
    const documento = Documento.criar('11144477735')
    await repositorio.salvar(Cliente.criar({ nome: 'João', documento }))

    assert.isTrue(await repositorio.existeComDocumento(documento))
    const achado = await repositorio.buscarPorDocumento(documento)
    assert.equal(achado!.nome, 'João')
  })

  test('atualiza um cliente existente', async ({ assert }) => {
    const cliente = Cliente.criar({ nome: 'Ana', documento: Documento.criar('11144477735') })
    await repositorio.salvar(cliente)

    cliente.atualizar({ nome: 'Ana Paula', telefone: '1133334444' })
    await repositorio.salvar(cliente)

    const recuperado = await repositorio.buscarPorId(cliente.id)
    assert.equal(recuperado!.nome, 'Ana Paula')
    assert.equal(recuperado!.telefone, '1133334444')
  })

  test('isolamento: o cliente do teste anterior não vaza', async ({ assert }) => {
    const clientes = await repositorio.listar()
    assert.equal(clientes.length, 0)
  })

  test('buscarPorId inexistente retorna null', async ({ assert }) => {
    assert.isNull(await repositorio.buscarPorId('nao-existe'))
  })

  test('remove um cliente', async ({ assert }) => {
    const cliente = Cliente.criar({ nome: 'Carlos', documento: Documento.criar('11144477735') })
    await repositorio.salvar(cliente)
    await repositorio.remover(cliente.id)
    assert.isNull(await repositorio.buscarPorId(cliente.id))
  })
})
