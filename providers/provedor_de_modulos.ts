import type { ApplicationService } from '@adonisjs/core/types'
import { UnidadeDeTrabalhoLucid } from '#shared/frameworks-drivers/unidade-de-trabalho'
import { registrarAutenticacao } from '#modulos/autenticacao/frameworks-drivers/fabrica'
import { registrarClientes } from '#modulos/clientes/frameworks-drivers/fabrica'
import { registrarVeiculos } from '#modulos/veiculos/frameworks-drivers/fabrica'
import { registrarServicos } from '#modulos/servicos/frameworks-drivers/fabrica'
import { registrarEstoque } from '#modulos/estoque/frameworks-drivers/fabrica'
import { registrarOrdensServico } from '#modulos/ordens-servico/frameworks-drivers/fabrica'
import { registrarPagamento } from '#modulos/pagamento/frameworks-drivers/fabrica'

/**
 * Provider raiz dos módulos de negócio: pluga as composition roots de cada
 * bounded context no ciclo de vida do AdonisJS. Cada módulo expõe uma função
 * `registrar<Modulo>` em `frameworks-drivers/fabrica.ts`.
 */
export default class ProvedorDeModulos {
  constructor(protected app: ApplicationService) {}

  register() {
    this.app.container.singleton(UnidadeDeTrabalhoLucid, () => new UnidadeDeTrabalhoLucid())

    registrarAutenticacao(this.app)
    registrarClientes(this.app)
    registrarVeiculos(this.app)
    registrarServicos(this.app)
    registrarEstoque(this.app)
    registrarOrdensServico(this.app)
    registrarPagamento(this.app)
  }
}
