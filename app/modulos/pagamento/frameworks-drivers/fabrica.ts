import type { ApplicationService } from '@adonisjs/core/types'
import { RepositorioDePagamentosLucid } from '../interface-adapters/gateways/repositorio-de-pagamentos-lucid.js'
import { GerarCobranca } from '../use-cases/gerar-cobranca.js'
import { AplicarDesconto } from '../use-cases/aplicar-desconto.js'
import { RegistrarPagamento } from '../use-cases/registrar-pagamento.js'
import { EmitirNotaFiscal } from '../use-cases/emitir-nota-fiscal.js'
import { ObterPagamento } from '../use-cases/obter-pagamento.js'

/** Composition root do módulo: registra adaptadores e casos de uso no container. */
export function registrarPagamento(app: ApplicationService) {
  const c = app.container
  c.singleton(RepositorioDePagamentosLucid, () => new RepositorioDePagamentosLucid())

  c.bind(GerarCobranca, async (r) => new GerarCobranca(await r.make(RepositorioDePagamentosLucid)))
  c.bind(
    AplicarDesconto,
    async (r) => new AplicarDesconto(await r.make(RepositorioDePagamentosLucid))
  )
  c.bind(
    RegistrarPagamento,
    async (r) => new RegistrarPagamento(await r.make(RepositorioDePagamentosLucid))
  )
  c.bind(
    EmitirNotaFiscal,
    async (r) => new EmitirNotaFiscal(await r.make(RepositorioDePagamentosLucid))
  )
  c.bind(
    ObterPagamento,
    async (r) => new ObterPagamento(await r.make(RepositorioDePagamentosLucid))
  )
}
