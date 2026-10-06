import { test } from '@japa/runner'
import { Veiculo } from '#modulos/veiculos/entities/veiculo'
import { Placa } from '#modulos/veiculos/entities/objetos-de-valor/placa'

function novoVeiculo(clienteId = 'cliente-1') {
  return Veiculo.criar({
    clienteId,
    placa: Placa.criar('ABC1D23'),
    marca: 'Fiat',
    modelo: 'Uno',
    ano: 2020,
  })
}

test.group('Veiculo (agregado)', () => {
  test('ao criar registra cadastrado e vinculado-ao-cliente', ({ assert }) => {
    const veiculo = novoVeiculo()
    const nomes = veiculo.extrairEventos().map((e) => e.nome)
    assert.deepEqual(nomes, ['veiculos.cadastrado', 'veiculos.vinculado-ao-cliente'])
  })

  test('vincularCliente troca o dono e registra evento', ({ assert }) => {
    const veiculo = novoVeiculo('cliente-1')
    veiculo.extrairEventos() // descarta eventos de criação
    veiculo.vincularCliente('cliente-2')
    assert.equal(veiculo.clienteId, 'cliente-2')
    const eventos = veiculo.extrairEventos()
    assert.lengthOf(eventos, 1)
    assert.equal(eventos[0].nome, 'veiculos.vinculado-ao-cliente')
  })

  test('vincular ao mesmo cliente é no-op (não emite evento)', ({ assert }) => {
    const veiculo = novoVeiculo('cliente-1')
    veiculo.extrairEventos()
    veiculo.vincularCliente('cliente-1')
    assert.lengthOf(veiculo.extrairEventos(), 0)
  })
})
