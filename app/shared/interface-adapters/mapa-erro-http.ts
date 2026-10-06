import type { ErroDeDominio } from '#shared/entities/erros'

/**
 * Mapeia o `codigo` de um erro de domínio para o status HTTP correspondente.
 *
 * O conhecimento de transporte fica na borda (adaptadores de interface); o
 * domínio expõe apenas códigos legíveis por máquina.
 */
const MAPA: Record<string, number> = {
  VALIDACAO_INVALIDA: 422,
  REGRA_DE_NEGOCIO_VIOLADA: 422,
  RECURSO_NAO_ENCONTRADO: 404,
  CONFLITO_DE_RECURSO: 409,
  NAO_AUTENTICADO: 401,
}

export function statusHttpDoErro(erro: ErroDeDominio): number {
  return MAPA[erro.codigo] ?? 400
}
