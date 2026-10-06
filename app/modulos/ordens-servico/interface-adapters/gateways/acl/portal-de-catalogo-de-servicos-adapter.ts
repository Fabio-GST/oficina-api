import type { Servico } from '#modulos/servicos/entities/servico'
import type { RepositorioDeServicos } from '#modulos/servicos/use-cases/ports/repositorio-de-servicos'
import type {
  PortalDeCatalogoDeServicos,
  ServicoDoCatalogo,
} from '../../../use-cases/ports/portal-de-catalogo-de-servicos.js'

/** Adapter ACL: traduz o Catálogo de Serviços para a linguagem de OS. */
export class PortalDeCatalogoDeServicosAdapter implements PortalDeCatalogoDeServicos {
  constructor(private readonly servicos: RepositorioDeServicos) {}

  async obterServico(id: string): Promise<ServicoDoCatalogo | null> {
    const servico = await this.servicos.buscarPorId(id)
    return servico ? paraCatalogo(servico) : null
  }

  async obterServicos(ids: string[]): Promise<ServicoDoCatalogo[]> {
    const servicos = await this.servicos.buscarVarios(ids)
    return servicos.map(paraCatalogo)
  }
}

function paraCatalogo(servico: Servico): ServicoDoCatalogo {
  return { id: servico.id, nome: servico.nome, preco: servico.preco, ativo: servico.ativo }
}
