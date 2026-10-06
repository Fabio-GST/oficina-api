import type { CasoDeUso } from '#shared/use-cases/caso-de-uso'
import { RecursoNaoEncontrado } from '#shared/entities/erros'
import type { RepositorioDeServicos } from './ports/repositorio-de-servicos.js'

/** Remove definitivamente um serviço do catálogo. */
export class RemoverServico implements CasoDeUso<string, void> {
  constructor(private readonly repositorio: RepositorioDeServicos) {}

  async executar(id: string): Promise<void> {
    const servico = await this.repositorio.buscarPorId(id)
    if (!servico) {
      throw new RecursoNaoEncontrado('Serviço', id)
    }
    await this.repositorio.remover(id)
  }
}
