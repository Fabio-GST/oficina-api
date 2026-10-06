/**
 * Executa uma função assíncrona e devolve o erro lançado (ou `undefined` se não
 * lançou). Útil para asserções sobre o tipo/mensagem do erro nos testes.
 */
export async function capturarErro(fn: () => Promise<unknown>): Promise<unknown> {
  try {
    await fn()
    return undefined
  } catch (erro) {
    return erro
  }
}
