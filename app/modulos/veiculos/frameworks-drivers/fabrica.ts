import type { ApplicationService } from '@adonisjs/core/types'
import { RepositorioDeClientesLucid } from '#modulos/clientes/interface-adapters/gateways/repositorio-de-clientes-lucid'
import { RepositorioDeVeiculosLucid } from '../interface-adapters/gateways/repositorio-de-veiculos-lucid.js'
import { PortalDeClientesAdapter } from '../interface-adapters/gateways/acl/portal-de-clientes-adapter.js'
import { CriarVeiculo } from '../use-cases/criar-veiculo.js'
import { AtualizarVeiculo } from '../use-cases/atualizar-veiculo.js'
import { VincularClienteAoVeiculo } from '../use-cases/vincular-cliente-ao-veiculo.js'
import { BuscarVeiculoPorPlaca } from '../use-cases/buscar-veiculo-por-placa.js'
import { ObterVeiculo } from '../use-cases/obter-veiculo.js'
import { ListarVeiculos } from '../use-cases/listar-veiculos.js'
import { RemoverVeiculo } from '../use-cases/remover-veiculo.js'

/** Composition root do módulo: registra adaptadores e casos de uso no container. */
export function registrarVeiculos(app: ApplicationService) {
  const c = app.container
  c.singleton(RepositorioDeVeiculosLucid, () => new RepositorioDeVeiculosLucid())
  c.singleton(
    PortalDeClientesAdapter,
    async (r) => new PortalDeClientesAdapter(await r.make(RepositorioDeClientesLucid))
  )

  c.bind(
    CriarVeiculo,
    async (r) =>
      new CriarVeiculo(
        await r.make(RepositorioDeVeiculosLucid),
        await r.make(PortalDeClientesAdapter)
      )
  )
  c.bind(
    AtualizarVeiculo,
    async (r) => new AtualizarVeiculo(await r.make(RepositorioDeVeiculosLucid))
  )
  c.bind(
    VincularClienteAoVeiculo,
    async (r) =>
      new VincularClienteAoVeiculo(
        await r.make(RepositorioDeVeiculosLucid),
        await r.make(PortalDeClientesAdapter)
      )
  )
  c.bind(
    BuscarVeiculoPorPlaca,
    async (r) => new BuscarVeiculoPorPlaca(await r.make(RepositorioDeVeiculosLucid))
  )
  c.bind(ObterVeiculo, async (r) => new ObterVeiculo(await r.make(RepositorioDeVeiculosLucid)))
  c.bind(ListarVeiculos, async (r) => new ListarVeiculos(await r.make(RepositorioDeVeiculosLucid)))
  c.bind(RemoverVeiculo, async (r) => new RemoverVeiculo(await r.make(RepositorioDeVeiculosLucid)))
}
