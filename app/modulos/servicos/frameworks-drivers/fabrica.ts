import type { ApplicationService } from '@adonisjs/core/types'
import { RepositorioDeServicosLucid } from '../interface-adapters/gateways/repositorio-de-servicos-lucid.js'
import { CriarServico } from '../use-cases/criar-servico.js'
import { AtualizarServico } from '../use-cases/atualizar-servico.js'
import { InativarServico } from '../use-cases/inativar-servico.js'
import { ReativarServico } from '../use-cases/reativar-servico.js'
import { DefinirTempoEstimado } from '../use-cases/definir-tempo-estimado.js'
import { ObterServico } from '../use-cases/obter-servico.js'
import { ListarServicos } from '../use-cases/listar-servicos.js'
import { RemoverServico } from '../use-cases/remover-servico.js'

/** Composition root do módulo: registra adaptadores e casos de uso no container. */
export function registrarServicos(app: ApplicationService) {
  const c = app.container
  c.singleton(RepositorioDeServicosLucid, () => new RepositorioDeServicosLucid())

  c.bind(CriarServico, async (r) => new CriarServico(await r.make(RepositorioDeServicosLucid)))
  c.bind(
    AtualizarServico,
    async (r) => new AtualizarServico(await r.make(RepositorioDeServicosLucid))
  )
  c.bind(
    InativarServico,
    async (r) => new InativarServico(await r.make(RepositorioDeServicosLucid))
  )
  c.bind(
    ReativarServico,
    async (r) => new ReativarServico(await r.make(RepositorioDeServicosLucid))
  )
  c.bind(
    DefinirTempoEstimado,
    async (r) => new DefinirTempoEstimado(await r.make(RepositorioDeServicosLucid))
  )
  c.bind(ObterServico, async (r) => new ObterServico(await r.make(RepositorioDeServicosLucid)))
  c.bind(ListarServicos, async (r) => new ListarServicos(await r.make(RepositorioDeServicosLucid)))
  c.bind(RemoverServico, async (r) => new RemoverServico(await r.make(RepositorioDeServicosLucid)))
}
