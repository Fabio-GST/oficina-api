export interface ConteudoAutenticado {
  sub: string
  nome: string
  email: string
}

/**
 * Abstração para emissão de tokens de acesso. Implementada por um serviço JWT
 * na infraestrutura.
 */
export interface EmissorDeToken {
  emitir(conteudo: ConteudoAutenticado): string
}
