/**
 * Hierarquia de erros do domínio/aplicação.
 *
 * Cada erro carrega um `codigo` legível por máquina. A tradução para HTTP
 * acontece na borda (ver `app/shared/interface-adapters/mapa-erro-http.ts` e o manipulador
 * global de exceções) — o domínio não conhece transporte.
 */
export abstract class ErroDeDominio extends Error {
  abstract readonly codigo: string

  constructor(mensagem: string) {
    super(mensagem)
    this.name = new.target.name
  }
}

/** Dados de entrada inválidos ou regra de formato violada (ex.: CPF inválido). */
export class ErroDeValidacao extends ErroDeDominio {
  readonly codigo = 'VALIDACAO_INVALIDA'
}

/** Regra de negócio violada (ex.: transição de status não permitida). */
export class RegraDeNegocioViolada extends ErroDeDominio {
  readonly codigo = 'REGRA_DE_NEGOCIO_VIOLADA'
}

/** Recurso solicitado não existe. */
export class RecursoNaoEncontrado extends ErroDeDominio {
  readonly codigo = 'RECURSO_NAO_ENCONTRADO'

  constructor(recurso: string, identificador?: string) {
    super(
      identificador
        ? `${recurso} não encontrado(a): ${identificador}`
        : `${recurso} não encontrado(a)`
    )
  }
}

/** Conflito com o estado atual (ex.: documento já cadastrado). */
export class ConflitoDeRecurso extends ErroDeDominio {
  readonly codigo = 'CONFLITO_DE_RECURSO'
}

/** Falha de autenticação. */
export class NaoAutenticado extends ErroDeDominio {
  readonly codigo = 'NAO_AUTENTICADO'

  constructor(mensagem = 'Credenciais inválidas ou ausentes.') {
    super(mensagem)
  }
}
