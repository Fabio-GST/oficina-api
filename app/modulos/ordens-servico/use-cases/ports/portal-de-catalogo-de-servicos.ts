import type { Dinheiro } from '#shared/entities/objetos-de-valor/dinheiro'

/**
 * Porta ACL para o Catálogo de Serviços, na linguagem de Ordens de Serviço.
 */
export interface ServicoDoCatalogo {
  id: string
  nome: string
  preco: Dinheiro
  ativo: boolean
}

export interface PortalDeCatalogoDeServicos {
  obterServico(id: string): Promise<ServicoDoCatalogo | null>
  obterServicos(ids: string[]): Promise<ServicoDoCatalogo[]>
}
