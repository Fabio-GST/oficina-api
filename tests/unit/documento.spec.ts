import { test } from '@japa/runner'
import { Documento } from '#modulos/clientes/entities/objetos-de-valor/documento'

test.group('Documento (CPF/CNPJ)', () => {
  test('aceita um CPF válido e identifica o tipo', ({ assert }) => {
    const doc = Documento.criar('111.444.777-35')
    assert.equal(doc.valor, '11144477735')
    assert.equal(doc.tipo, 'CPF')
  })

  test('aceita um CNPJ válido e identifica o tipo', ({ assert }) => {
    const doc = Documento.criar('11.222.333/0001-81')
    assert.equal(doc.valor, '11222333000181')
    assert.equal(doc.tipo, 'CNPJ')
  })

  test('rejeita CPF com dígito verificador inválido', ({ assert }) => {
    assert.throws(() => Documento.criar('111.444.777-00'))
  })

  test('rejeita CPF com todos os dígitos iguais', ({ assert }) => {
    assert.throws(() => Documento.criar('111.111.111-11'))
  })

  test('rejeita CNPJ inválido', ({ assert }) => {
    assert.throws(() => Documento.criar('11.222.333/0001-00'))
  })

  test('rejeita documento com tamanho incorreto', ({ assert }) => {
    assert.throws(() => Documento.criar('123'))
  })
})
