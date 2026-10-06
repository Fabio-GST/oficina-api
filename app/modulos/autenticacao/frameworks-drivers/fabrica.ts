import type { ApplicationService } from '@adonisjs/core/types'
import { servicoDeHash } from '#shared/frameworks-drivers/hash/servico-de-hash-adonis'
import { servicoJwt } from '#shared/frameworks-drivers/jwt/servico-jwt'
import { RepositorioDeUsuariosLucid } from '../interface-adapters/gateways/repositorio-de-usuarios-lucid.js'
import { RegistrarAdministrador } from '../use-cases/registrar-administrador.js'
import { Autenticar } from '../use-cases/autenticar.js'

/**
 * Composition root do módulo de Autenticação: conecta as implementações de
 * infraestrutura (repositório Lucid, hash, JWT) aos casos de uso via container.
 */
export function registrarAutenticacao(app: ApplicationService) {
  const c = app.container
  c.singleton(RepositorioDeUsuariosLucid, () => new RepositorioDeUsuariosLucid())

  c.bind(
    RegistrarAdministrador,
    async (r) => new RegistrarAdministrador(await r.make(RepositorioDeUsuariosLucid), servicoDeHash)
  )
  c.bind(
    Autenticar,
    async (r) => new Autenticar(await r.make(RepositorioDeUsuariosLucid), servicoDeHash, servicoJwt)
  )
}
