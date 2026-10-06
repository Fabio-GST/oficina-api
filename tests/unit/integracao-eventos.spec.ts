import { test } from '@japa/runner'
import { Dinheiro } from '#shared/entities/objetos-de-valor/dinheiro'
import { barramentoDeEventos } from '#shared/frameworks-drivers/eventos/barramento-de-eventos'
import type { ServicoDeNotificacao } from '#shared/use-cases/servico-de-notificacao'

import { Peca } from '#modulos/estoque/entities/peca'
import { QuantidadeEstoque } from '#modulos/estoque/entities/objetos-de-valor/quantidade-estoque'
import { UtilizarPeca } from '#modulos/estoque/use-cases/utilizar-peca'
import { SolicitarCompra } from '#modulos/estoque/use-cases/solicitar-compra'
import type { RepositorioDePecas } from '#modulos/estoque/use-cases/ports/repositorio-de-pecas'
import type { RepositorioDeSolicitacoesCompra } from '#modulos/estoque/use-cases/ports/repositorio-de-solicitacoes-compra'
import type { SolicitacaoDeCompra } from '#modulos/estoque/entities/solicitacao-de-compra'

import { GerarCobranca } from '#modulos/pagamento/use-cases/gerar-cobranca'
import { RegistrarPagamento } from '#modulos/pagamento/use-cases/registrar-pagamento'
import { EmitirNotaFiscal } from '#modulos/pagamento/use-cases/emitir-nota-fiscal'
import type { RepositorioDePagamentos } from '#modulos/pagamento/use-cases/ports/repositorio-de-pagamentos'
import type { Pagamento } from '#modulos/pagamento/entities/pagamento'

import { SolicitarCompraAoAtingirMinimo } from '#politicas/solicitar-compra-ao-atingir-minimo'
import { EmitirNotaAoConfirmarPagamento } from '#politicas/emitir-nota-ao-confirmar-pagamento'

/** Repositórios in-memory (sem banco) para exercitar a cadeia de eventos. */
class PecasMemoria implements RepositorioDePecas {
  private readonly mapa = new Map<string, Peca>()
  async salvar(peca: Peca) {
    this.mapa.set(peca.id, peca)
  }
  async buscarPorId(id: string) {
    return this.mapa.get(id) ?? null
  }
  async buscarVarias(ids: string[]) {
    return ids.map((id) => this.mapa.get(id)).filter((p): p is Peca => p !== undefined)
  }
  async listar() {
    return [...this.mapa.values()]
  }
  async remover(id: string) {
    this.mapa.delete(id)
  }
}

class SolicitacoesMemoria implements RepositorioDeSolicitacoesCompra {
  readonly itens = new Map<string, SolicitacaoDeCompra>()
  async salvar(s: SolicitacaoDeCompra) {
    this.itens.set(s.id, s)
  }
  async buscarPorId(id: string) {
    return this.itens.get(id) ?? null
  }
  async listar() {
    return [...this.itens.values()]
  }
}

class PagamentosMemoria implements RepositorioDePagamentos {
  readonly mapa = new Map<string, Pagamento>()
  async salvar(p: Pagamento) {
    this.mapa.set(p.id, p)
  }
  async buscarPorId(id: string) {
    return this.mapa.get(id) ?? null
  }
  async buscarPorOrdem(ordemId: string) {
    return [...this.mapa.values()].find((p) => p.ordemId === ordemId) ?? null
  }
  async listar() {
    return [...this.mapa.values()]
  }
}

const notificacaoFake: ServicoDeNotificacao = {
  async notificarCliente() {},
  async notificarAlmoxarife() {},
}

test.group('Integração orientada a eventos', (group) => {
  // Isola o barramento singleton entre os testes.
  group.each.setup(() => {
    barramentoDeEventos.limpar()
    return () => barramentoDeEventos.limpar()
  })

  test('utilizar peça abaixo do mínimo dispara solicitação de compra (Estoque)', async ({
    assert,
  }) => {
    const pecas = new PecasMemoria()
    const solicitacoes = new SolicitacoesMemoria()

    barramentoDeEventos.registrar(
      new SolicitarCompraAoAtingirMinimo(
        (e) => new SolicitarCompra(solicitacoes, pecas).executar(e),
        notificacaoFake
      )
    )

    const peca = Peca.criar({
      nome: 'Pastilha de freio',
      preco: Dinheiro.deReais(80),
      quantidadeEstoque: QuantidadeEstoque.criar(10),
      estoqueMinimo: 8,
    })
    peca.reservar(3) // disponível 7
    peca.extrairEventos() // limpa eventos da criação/reserva
    await pecas.salvar(peca)

    // Consome a reserva: disponível segue 7 (< mínimo 8) → publica abaixo-do-minimo
    await new UtilizarPeca(pecas).executar({ id: peca.id, quantidade: 3 })

    const compras = await solicitacoes.listar()
    assert.lengthOf(compras, 1)
    assert.equal(compras[0].pecaId, peca.id)
    // repõe até o dobro do mínimo: 8*2 - 7 = 9
    assert.equal(compras[0].quantidade, 9)
  })

  test('pagamento integral dispara emissão da Nota Fiscal (Pagamento)', async ({ assert }) => {
    const pagamentos = new PagamentosMemoria()

    barramentoDeEventos.registrar(
      new EmitirNotaAoConfirmarPagamento((id) => new EmitirNotaFiscal(pagamentos).executar(id))
    )

    const cobranca = await new GerarCobranca(pagamentos).executar({ ordemId: 'os-1', total: 200 })
    assert.equal(cobranca.status, 'PENDENTE')
    assert.isNull(cobranca.notaFiscalNumero)

    await new RegistrarPagamento(pagamentos).executar({ id: cobranca.id, valor: 200 })

    const pagamento = await pagamentos.buscarPorId(cobranca.id)
    assert.equal(pagamento?.status, 'QUITADO')
    assert.isNotNull(pagamento?.notaFiscalNumero)
  })

  test('pagamento parcial NÃO emite Nota Fiscal', async ({ assert }) => {
    const pagamentos = new PagamentosMemoria()
    barramentoDeEventos.registrar(
      new EmitirNotaAoConfirmarPagamento((id) => new EmitirNotaFiscal(pagamentos).executar(id))
    )

    const cobranca = await new GerarCobranca(pagamentos).executar({ ordemId: 'os-2', total: 200 })
    await new RegistrarPagamento(pagamentos).executar({ id: cobranca.id, valor: 50 })

    const pagamento = await pagamentos.buscarPorId(cobranca.id)
    assert.equal(pagamento?.status, 'PARCIAL')
    assert.isNull(pagamento?.notaFiscalNumero)
  })
})
