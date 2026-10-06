import type { ApplicationService } from '@adonisjs/core/types'
import { UnidadeDeTrabalhoLucid } from '#shared/frameworks-drivers/unidade-de-trabalho'
import { RepositorioDePecasLucid } from '../interface-adapters/gateways/repositorio-de-pecas-lucid.js'
import { RepositorioDeSolicitacoesCompraLucid } from '../interface-adapters/gateways/repositorio-de-solicitacoes-compra-lucid.js'
import { CriarPeca } from '../use-cases/criar-peca.js'
import { AtualizarPeca } from '../use-cases/atualizar-peca.js'
import { AjustarEstoque } from '../use-cases/ajustar-estoque.js'
import { ReservarPeca } from '../use-cases/reservar-peca.js'
import { LiberarReservaDePeca } from '../use-cases/liberar-reserva-de-peca.js'
import { UtilizarPeca } from '../use-cases/utilizar-peca.js'
import { DefinirEstoqueMinimo } from '../use-cases/definir-estoque-minimo.js'
import { ObterPeca } from '../use-cases/obter-peca.js'
import { ListarPecas } from '../use-cases/listar-pecas.js'
import { RemoverPeca } from '../use-cases/remover-peca.js'
import { SolicitarCompra } from '../use-cases/solicitar-compra.js'
import { ReceberCompra } from '../use-cases/receber-compra.js'

/** Composition root do módulo: registra adaptadores e casos de uso no container. */
export function registrarEstoque(app: ApplicationService) {
  const c = app.container
  c.singleton(RepositorioDePecasLucid, () => new RepositorioDePecasLucid())
  c.singleton(
    RepositorioDeSolicitacoesCompraLucid,
    () => new RepositorioDeSolicitacoesCompraLucid()
  )

  c.bind(CriarPeca, async (r) => new CriarPeca(await r.make(RepositorioDePecasLucid)))
  c.bind(AtualizarPeca, async (r) => new AtualizarPeca(await r.make(RepositorioDePecasLucid)))
  c.bind(AjustarEstoque, async (r) => new AjustarEstoque(await r.make(RepositorioDePecasLucid)))
  c.bind(ReservarPeca, async (r) => new ReservarPeca(await r.make(RepositorioDePecasLucid)))
  c.bind(
    LiberarReservaDePeca,
    async (r) => new LiberarReservaDePeca(await r.make(RepositorioDePecasLucid))
  )
  c.bind(UtilizarPeca, async (r) => new UtilizarPeca(await r.make(RepositorioDePecasLucid)))
  c.bind(
    DefinirEstoqueMinimo,
    async (r) => new DefinirEstoqueMinimo(await r.make(RepositorioDePecasLucid))
  )
  c.bind(
    SolicitarCompra,
    async (r) =>
      new SolicitarCompra(
        await r.make(RepositorioDeSolicitacoesCompraLucid),
        await r.make(RepositorioDePecasLucid)
      )
  )
  c.bind(
    ReceberCompra,
    async (r) =>
      new ReceberCompra(
        await r.make(RepositorioDeSolicitacoesCompraLucid),
        await r.make(RepositorioDePecasLucid),
        await r.make(UnidadeDeTrabalhoLucid)
      )
  )
  c.bind(ObterPeca, async (r) => new ObterPeca(await r.make(RepositorioDePecasLucid)))
  c.bind(ListarPecas, async (r) => new ListarPecas(await r.make(RepositorioDePecasLucid)))
  c.bind(RemoverPeca, async (r) => new RemoverPeca(await r.make(RepositorioDePecasLucid)))
}
