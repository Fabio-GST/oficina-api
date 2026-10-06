import type { ApplicationService } from '@adonisjs/core/types'
import { UnidadeDeTrabalhoLucid } from '#shared/frameworks-drivers/unidade-de-trabalho'
import { RepositorioDeClientesLucid } from '#modulos/clientes/interface-adapters/gateways/repositorio-de-clientes-lucid'
import { RepositorioDeVeiculosLucid } from '#modulos/veiculos/interface-adapters/gateways/repositorio-de-veiculos-lucid'
import { RepositorioDeServicosLucid } from '#modulos/servicos/interface-adapters/gateways/repositorio-de-servicos-lucid'
import { RepositorioDePecasLucid } from '#modulos/estoque/interface-adapters/gateways/repositorio-de-pecas-lucid'
import { ReservarPeca } from '#modulos/estoque/use-cases/reservar-peca'
import { RepositorioDeOrdensServicoLucid } from '../interface-adapters/gateways/repositorio-de-ordens-servico-lucid.js'
import { PortalDeClientesAdapter } from '../interface-adapters/gateways/acl/portal-de-clientes-adapter.js'
import { PortalDeVeiculosAdapter } from '../interface-adapters/gateways/acl/portal-de-veiculos-adapter.js'
import { PortalDeCatalogoDeServicosAdapter } from '../interface-adapters/gateways/acl/portal-de-catalogo-de-servicos-adapter.js'
import { PortalDeEstoqueAdapter } from '../interface-adapters/gateways/acl/portal-de-estoque-adapter.js'
import { CriarOrdemServico } from '../use-cases/criar-ordem-servico.js'
import { ProcessarDecisaoOrcamento } from '../use-cases/processar-decisao-orcamento.js'
import { AdicionarServicoNaOrdem, AdicionarPecaNaOrdem } from '../use-cases/gerir-itens.js'
import {
  AlterarStatusDaOrdem,
  AprovarOrdemServico,
  IniciarDiagnostico,
  GerarOrcamento,
  RecusarOrdemServico,
  RenegociarOrdemServico,
  FinalizarOrdemServico,
  EntregarVeiculo,
} from '../use-cases/gerir-status.js'
import {
  DetalharOrdem,
  ListarOrdens,
  ConsultarAndamento,
  CalcularTempoMedioExecucao,
} from '../use-cases/consultas.js'

/** Composition root do módulo: registra adaptadores e casos de uso no container. */
export function registrarOrdensServico(app: ApplicationService) {
  const c = app.container
  c.singleton(RepositorioDeOrdensServicoLucid, () => new RepositorioDeOrdensServicoLucid())

  // Adapters ACL para os contextos vizinhos
  c.singleton(
    PortalDeClientesAdapter,
    async (r) => new PortalDeClientesAdapter(await r.make(RepositorioDeClientesLucid))
  )
  c.singleton(
    PortalDeVeiculosAdapter,
    async (r) => new PortalDeVeiculosAdapter(await r.make(RepositorioDeVeiculosLucid))
  )
  c.singleton(
    PortalDeCatalogoDeServicosAdapter,
    async (r) => new PortalDeCatalogoDeServicosAdapter(await r.make(RepositorioDeServicosLucid))
  )
  c.singleton(
    PortalDeEstoqueAdapter,
    async (r) =>
      new PortalDeEstoqueAdapter(await r.make(RepositorioDePecasLucid), await r.make(ReservarPeca))
  )

  c.bind(
    CriarOrdemServico,
    async (r) =>
      new CriarOrdemServico(
        await r.make(RepositorioDeOrdensServicoLucid),
        await r.make(PortalDeClientesAdapter),
        await r.make(PortalDeVeiculosAdapter),
        await r.make(PortalDeCatalogoDeServicosAdapter),
        await r.make(PortalDeEstoqueAdapter),
        await r.make(UnidadeDeTrabalhoLucid)
      )
  )
  c.bind(
    AdicionarServicoNaOrdem,
    async (r) =>
      new AdicionarServicoNaOrdem(
        await r.make(RepositorioDeOrdensServicoLucid),
        await r.make(PortalDeCatalogoDeServicosAdapter)
      )
  )
  c.bind(
    AdicionarPecaNaOrdem,
    async (r) =>
      new AdicionarPecaNaOrdem(
        await r.make(RepositorioDeOrdensServicoLucid),
        await r.make(PortalDeEstoqueAdapter),
        await r.make(UnidadeDeTrabalhoLucid)
      )
  )

  const simples = [
    AlterarStatusDaOrdem,
    AprovarOrdemServico,
    ProcessarDecisaoOrcamento,
    IniciarDiagnostico,
    GerarOrcamento,
    RecusarOrdemServico,
    RenegociarOrdemServico,
    FinalizarOrdemServico,
    EntregarVeiculo,
    DetalharOrdem,
    ListarOrdens,
    ConsultarAndamento,
    CalcularTempoMedioExecucao,
  ] as const
  for (const CasoDeUso of simples) {
    c.bind(CasoDeUso, async (r) => new CasoDeUso(await r.make(RepositorioDeOrdensServicoLucid)))
  }
}
