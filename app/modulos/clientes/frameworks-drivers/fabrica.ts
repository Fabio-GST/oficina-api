import type { ApplicationService } from '@adonisjs/core/types'
import { RepositorioDeClientesLucid } from '../interface-adapters/gateways/repositorio-de-clientes-lucid.js'
import { CriarCliente } from '../use-cases/criar-cliente.js'
import { AtualizarCliente } from '../use-cases/atualizar-cliente.js'
import { BuscarClientePorDocumento } from '../use-cases/buscar-cliente-por-documento.js'
import { ObterCliente } from '../use-cases/obter-cliente.js'
import { ListarClientes } from '../use-cases/listar-clientes.js'
import { RemoverCliente } from '../use-cases/remover-cliente.js'

/**
 * Composition root do módulo: registra no container IoC os adaptadores e casos
 * de uso. As portas são interfaces TypeScript (não existem em runtime), então
 * cada caso de uso é registrado com uma fábrica explícita que resolve o
 * adaptador concreto.
 */
export function registrarClientes(app: ApplicationService) {
  app.container.singleton(RepositorioDeClientesLucid, () => new RepositorioDeClientesLucid())

  app.container.bind(
    CriarCliente,
    async (r) => new CriarCliente(await r.make(RepositorioDeClientesLucid))
  )
  app.container.bind(
    AtualizarCliente,
    async (r) => new AtualizarCliente(await r.make(RepositorioDeClientesLucid))
  )
  app.container.bind(
    BuscarClientePorDocumento,
    async (r) => new BuscarClientePorDocumento(await r.make(RepositorioDeClientesLucid))
  )
  app.container.bind(
    ObterCliente,
    async (r) => new ObterCliente(await r.make(RepositorioDeClientesLucid))
  )
  app.container.bind(
    ListarClientes,
    async (r) => new ListarClientes(await r.make(RepositorioDeClientesLucid))
  )
  app.container.bind(
    RemoverCliente,
    async (r) => new RemoverCliente(await r.make(RepositorioDeClientesLucid))
  )
}
