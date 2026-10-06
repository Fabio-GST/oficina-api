import app from '@adonisjs/core/services/app'

/**
 * Resolve um caso de uso (ou outro binding) do container IoC nos testes,
 * exatamente como os controllers recebem em produção.
 */
export function fazer<T>(token: new (...args: never[]) => T): Promise<T> {
  return app.container.make(token)
}

/** Resolve o caso de uso no container e executa-o com a entrada dada. */
export async function executar<E extends unknown[], S>(
  token: new (...args: never[]) => { executar(...entrada: E): Promise<S> },
  ...entrada: E
): Promise<S> {
  const casoDeUso: { executar(...entrada: E): Promise<S> } = await app.container.make(token)
  return casoDeUso.executar(...entrada)
}
