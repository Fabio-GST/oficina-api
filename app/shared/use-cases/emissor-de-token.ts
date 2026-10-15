/** Papel do portador do token: operador da oficina ou cliente autenticado por CPF. */
export type Papel = 'admin' | 'cliente'

export const PAPEIS: readonly Papel[] = ['admin', 'cliente']

/**
 * Claims do JWT aceitas pela API. É o CONTRATO compartilhado com a Function
 * de autenticação por CPF (repo oficina-auth-lambda), que emite tokens com
 * `sub` (id do cliente), `cpf`, `papel: 'cliente'` e `exp`, assinados com o
 * mesmo `JWT_SECRET` em HS256. O token do administrador (login por e-mail/
 * senha) carrega `sub`, `nome`, `email` e `papel: 'admin'`.
 */
export interface ConteudoAutenticado {
  /** Identificador do usuário administrativo ou do cliente. */
  sub: string
  papel: Papel
  nome?: string
  email?: string
  /** Presente apenas no token de cliente (apenas dígitos). */
  cpf?: string
}

/**
 * Abstração para emissão de tokens de acesso. Implementada por um serviço JWT
 * na infraestrutura.
 */
export interface EmissorDeToken {
  emitir(conteudo: ConteudoAutenticado): string
}
