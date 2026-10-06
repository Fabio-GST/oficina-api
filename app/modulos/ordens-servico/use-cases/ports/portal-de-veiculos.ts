/**
 * Porta ACL para o contexto de Veículos, na linguagem de Ordens de Serviço.
 */
export interface VeiculoDaOrdem {
  id: string
  clienteId: string
}

export interface PortalDeVeiculos {
  obterVeiculo(id: string): Promise<VeiculoDaOrdem | null>
}
