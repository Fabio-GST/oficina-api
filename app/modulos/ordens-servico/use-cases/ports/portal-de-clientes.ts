/**
 * Porta ACL para o contexto de Clientes, na linguagem de Ordens de Serviço.
 * Expõe apenas o que este módulo precisa de um cliente.
 */
export interface ClienteDaOrdem {
  id: string
}

export interface PortalDeClientes {
  obterCliente(id: string): Promise<ClienteDaOrdem | null>
}
