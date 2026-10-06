import type { SaidaAutenticar } from '../../use-cases/autenticar.js'
import type { SaidaRegistrarAdministrador } from '../../use-cases/registrar-administrador.js'

/** Presenters: único ponto que conhece o formato JSON externo dos recursos. */
export function apresentarSessao(dto: SaidaAutenticar) {
  return dto
}

export function apresentarAdministrador(dto: SaidaRegistrarAdministrador) {
  return dto
}
