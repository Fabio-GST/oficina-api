import { Pagamento } from '../../entities/pagamento.js'

export interface RepositorioDePagamentos {
  salvar(pagamento: Pagamento): Promise<void>
  buscarPorId(id: string): Promise<Pagamento | null>
  buscarPorOrdem(ordemId: string): Promise<Pagamento | null>
  listar(): Promise<Pagamento[]>
}
