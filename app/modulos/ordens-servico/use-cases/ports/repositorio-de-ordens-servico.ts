import { OrdemServico } from '../../entities/ordem-servico.js'

export interface RepositorioDeOrdensServico {
  salvar(ordem: OrdemServico): Promise<void>
  buscarPorId(id: string): Promise<OrdemServico | null>
  listar(): Promise<OrdemServico[]>
}
