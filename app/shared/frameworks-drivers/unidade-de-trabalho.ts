import db from '@adonisjs/lucid/services/db'
import type { UnidadeDeTrabalho } from '#shared/use-cases/unidade-de-trabalho'
import { publicarAposCommit } from '#shared/use-cases/coletor-de-eventos'
import { contextoTransacional } from './contexto-transacional.js'

/**
 * Unidade de Trabalho sobre transações do Lucid.
 *
 * Executa uma operação dentro de uma única transação de banco. Todos os
 * repositórios chamados dentro do callback participam automaticamente da mesma
 * transação (via {@link contextoTransacional}), garantindo atomicidade — por
 * exemplo, dar baixa no estoque e persistir a Ordem de Serviço de uma só vez.
 *
 * Os Eventos de Domínio coletados durante a operação (via `coletarEventosDe`)
 * são publicados somente **após o commit**, evitando reações a um estado que
 * ainda poderia sofrer rollback.
 */
export class UnidadeDeTrabalhoLucid implements UnidadeDeTrabalho {
  async executar<T>(operacao: () => Promise<T>): Promise<T> {
    return publicarAposCommit(() =>
      db.transaction((trx) => contextoTransacional.run(trx, operacao))
    )
  }
}
