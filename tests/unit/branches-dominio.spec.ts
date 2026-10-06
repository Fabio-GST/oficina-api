import { test } from '@japa/runner'
import { capturarErro } from '#tests/helpers/erros'
import { ErroDeValidacao, RegraDeNegocioViolada } from '#shared/entities/erros'
import { Dinheiro } from '#shared/entities/objetos-de-valor/dinheiro'
import { Cliente } from '#modulos/clientes/entities/cliente'
import { Documento } from '#modulos/clientes/entities/objetos-de-valor/documento'
import { Email } from '#modulos/autenticacao/entities/objetos-de-valor/email'
import { Veiculo } from '#modulos/veiculos/entities/veiculo'
import { Placa } from '#modulos/veiculos/entities/objetos-de-valor/placa'
import { Servico } from '#modulos/servicos/entities/servico'
import { Peca } from '#modulos/estoque/entities/peca'
import { QuantidadeEstoque } from '#modulos/estoque/entities/objetos-de-valor/quantidade-estoque'
import { SaldoEstoque } from '#modulos/estoque/entities/objetos-de-valor/saldo-estoque'
import { ItemOrdemServico } from '#modulos/ordens-servico/entities/item-ordem-servico'
import { OrdemServico } from '#modulos/ordens-servico/entities/ordem-servico'
import {
  StatusOrdemServico,
  StatusOS,
} from '#modulos/ordens-servico/entities/objetos-de-valor/status-ordem-servico'
import { Pagamento } from '#modulos/pagamento/entities/pagamento'

test.group('Branches de domínio — igualdade (Entidade / ObjetoDeValor)', () => {
  test('Entidade.iguala compara por identidade', ({ assert }) => {
    const a = Cliente.criar({ nome: 'A', documento: Documento.criar('11144477735') })
    const b = Cliente.reconstituir({
      id: a.id,
      nome: 'X',
      documento: Documento.criar('11144477735'),
    })
    const c = Cliente.criar({ nome: 'C', documento: Documento.criar('11144477735') })
    assert.isTrue(a.iguala(b))
    assert.isFalse(a.iguala(c))
    assert.isFalse(a.iguala(undefined))
  })

  test('ObjetoDeValor.iguala compara por estrutura e tipo', ({ assert }) => {
    const d1 = Documento.criar('11144477735')
    const d2 = Documento.criar('11144477735')
    assert.isTrue(d1.iguala(d2))
    assert.isFalse(d1.iguala(undefined))
    assert.isFalse(d1.iguala(Dinheiro.deReais(1) as any))
  })
})

test.group('Branches de domínio — Objetos de Valor', () => {
  test('Dinheiro.multiplicar rejeita fator inválido', async ({ assert }) => {
    assert.instanceOf(
      await capturarErro(async () => Dinheiro.deReais(10).multiplicar(-1)),
      ErroDeValidacao
    )
    assert.instanceOf(
      await capturarErro(async () => Dinheiro.deReais(10).multiplicar(1.5)),
      ErroDeValidacao
    )
  })

  test('Email rejeita formato inválido e normaliza válido', async ({ assert }) => {
    assert.instanceOf(await capturarErro(async () => Email.criar('invalido')), ErroDeValidacao)
    assert.equal(Email.criar('  Joao@Oficina.COM ').valor, 'joao@oficina.com')
  })

  test('StatusOrdemServico.criar rejeita valor inválido', async ({ assert }) => {
    assert.instanceOf(
      await capturarErro(async () => StatusOrdemServico.criar('X' as StatusOS)),
      ErroDeValidacao
    )
  })

  test('SaldoEstoque viola regra quando não há saldo/reserva', async ({ assert }) => {
    const saldo = SaldoEstoque.criar(5, 0)
    assert.instanceOf(await capturarErro(async () => saldo.reservar(10)), RegraDeNegocioViolada)
    assert.instanceOf(await capturarErro(async () => saldo.utilizar(1)), RegraDeNegocioViolada)
    assert.instanceOf(
      await capturarErro(async () => saldo.liberarReserva(1)),
      RegraDeNegocioViolada
    )
  })

  test('SaldoEstoque valida quantidade inválida', async ({ assert }) => {
    const saldo = SaldoEstoque.criar(5, 0)
    assert.instanceOf(await capturarErro(async () => saldo.reservar(-1)), ErroDeValidacao)
    assert.instanceOf(await capturarErro(async () => SaldoEstoque.criar(-1, 0)), ErroDeValidacao)
  })
})

test.group('Branches de domínio — Entidades', () => {
  test('Veiculo rejeita ano e vínculo inválidos', async ({ assert }) => {
    assert.instanceOf(
      await capturarErro(async () =>
        Veiculo.criar({
          clienteId: 'c1',
          placa: Placa.criar('ABC1D23'),
          marca: 'M',
          modelo: 'X',
          ano: 1800,
        })
      ),
      ErroDeValidacao
    )
    const veiculo = Veiculo.criar({
      clienteId: 'c1',
      placa: Placa.criar('ABC1D23'),
      marca: 'M',
      modelo: 'X',
      ano: 2020,
    })
    assert.instanceOf(
      await capturarErro(async () => veiculo.vincularCliente('  ')),
      ErroDeValidacao
    )
  })

  test('Servico exige nome e bloqueia alteração de inativo', async ({ assert }) => {
    assert.instanceOf(
      await capturarErro(async () => Servico.criar({ nome: '  ', preco: Dinheiro.deReais(1) })),
      ErroDeValidacao
    )
    const servico = Servico.criar({ nome: 'Troca', preco: Dinheiro.deReais(10) })
    servico.inativar()
    assert.instanceOf(
      await capturarErro(async () => servico.atualizarPreco(Dinheiro.deReais(20))),
      RegraDeNegocioViolada
    )
  })

  test('Peca exige nome ao criar e atualizar', async ({ assert }) => {
    assert.instanceOf(
      await capturarErro(async () =>
        Peca.criar({
          nome: '',
          preco: Dinheiro.deReais(1),
          quantidadeEstoque: QuantidadeEstoque.criar(1),
        })
      ),
      ErroDeValidacao
    )
    const peca = Peca.criar({
      nome: 'Óleo',
      preco: Dinheiro.deReais(1),
      quantidadeEstoque: QuantidadeEstoque.criar(1),
    })
    assert.instanceOf(
      await capturarErro(async () => peca.atualizar({ nome: '  ' })),
      ErroDeValidacao
    )
  })

  test('ItemOrdemServico exige quantidade positiva', async ({ assert }) => {
    assert.instanceOf(
      await capturarErro(async () =>
        ItemOrdemServico.criar({
          tipo: 'PECA',
          referenciaId: 'p1',
          descricao: 'x',
          precoUnitario: Dinheiro.deReais(1),
          quantidade: 0,
        })
      ),
      ErroDeValidacao
    )
  })
})

test.group('Branches de domínio — Pagamento', () => {
  test('gerarCobranca exige total positivo', async ({ assert }) => {
    assert.instanceOf(
      await capturarErro(async () =>
        Pagamento.gerarCobranca({ ordemId: 'os1', total: Dinheiro.zero() })
      ),
      ErroDeValidacao
    )
  })

  test('registrarPagamento exige valor positivo', async ({ assert }) => {
    const p = Pagamento.gerarCobranca({ ordemId: 'os1', total: Dinheiro.deReais(100) })
    assert.instanceOf(
      await capturarErro(async () => p.registrarPagamento(Dinheiro.zero())),
      ErroDeValidacao
    )
  })

  test('emitirNotaFiscal exige quitação e número', async ({ assert }) => {
    const p = Pagamento.gerarCobranca({ ordemId: 'os1', total: Dinheiro.deReais(100) })
    assert.instanceOf(
      await capturarErro(async () => p.emitirNotaFiscal('NF-1')),
      RegraDeNegocioViolada
    )
    p.registrarPagamento(Dinheiro.deReais(100))
    assert.instanceOf(await capturarErro(async () => p.emitirNotaFiscal('')), ErroDeValidacao)
  })
})

test.group('Branches de domínio — ciclo de vida da OS', () => {
  function novaOS() {
    return OrdemServico.criar({ clienteId: 'c1', veiculoId: 'v1' })
  }

  test('recusar/renegociar/aprovar fora de AGUARDANDO_APROVACAO violam regra', async ({
    assert,
  }) => {
    assert.instanceOf(await capturarErro(async () => novaOS().recusar()), RegraDeNegocioViolada)
    assert.instanceOf(await capturarErro(async () => novaOS().renegociar()), RegraDeNegocioViolada)
    assert.instanceOf(await capturarErro(async () => novaOS().aprovar()), RegraDeNegocioViolada)
  })

  test('gerarOrcamento sem itens viola regra', async ({ assert }) => {
    const os = novaOS()
    os.iniciarDiagnostico()
    assert.instanceOf(await capturarErro(async () => os.gerarOrcamento()), RegraDeNegocioViolada)
  })

  test('entregar/finalizar em estado inválido viola regra', async ({ assert }) => {
    assert.instanceOf(await capturarErro(async () => novaOS().finalizar()), RegraDeNegocioViolada)
    assert.instanceOf(await capturarErro(async () => novaOS().entregar()), RegraDeNegocioViolada)
  })
})
