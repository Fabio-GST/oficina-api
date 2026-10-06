import { test } from '@japa/runner'
import { Cliente } from '#modulos/clientes/entities/cliente'
import { Documento } from '#modulos/clientes/entities/objetos-de-valor/documento'
import { ClienteCadastrado } from '#modulos/clientes/entities/eventos/cliente-cadastrado'

function novoCliente() {
  return Cliente.criar({ nome: 'Maria', documento: Documento.criar('111.444.777-35') })
}

test.group('Cliente (agregado)', () => {
  test('ao criar registra evento clientes.cadastrado com o tipo de documento', ({ assert }) => {
    const cliente = novoCliente()
    const eventos = cliente.extrairEventos()
    assert.lengthOf(eventos, 1)
    const evento = eventos[0]
    assert.instanceOf(evento, ClienteCadastrado)
    assert.equal((evento as ClienteCadastrado).tipoDocumento, 'CPF')
  })

  test('atualizar dados não emite evento de cadastro', ({ assert }) => {
    const cliente = novoCliente()
    cliente.extrairEventos() // descarta o evento de criação
    cliente.atualizar({ nome: 'Maria Silva', telefone: '11999999999' })
    assert.equal(cliente.nome, 'Maria Silva')
    assert.lengthOf(cliente.extrairEventos(), 0)
  })
})
