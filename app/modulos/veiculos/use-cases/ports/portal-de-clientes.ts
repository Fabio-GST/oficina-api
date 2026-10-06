/**
 * Porta ACL para o contexto de Clientes, na linguagem de Veículos.
 * Este módulo só precisa saber se o dono existe.
 */
export interface PortalDeClientes {
  clienteExiste(id: string): Promise<boolean>
}
