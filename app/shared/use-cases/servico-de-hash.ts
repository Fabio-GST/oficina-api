/**
 * Abstração de hashing de segredos (ex.: senhas). A implementação concreta vive
 * na infraestrutura, mantendo os casos de uso independentes da biblioteca usada.
 */
export interface ServicoDeHash {
  gerar(textoPuro: string): Promise<string>
  verificar(textoPuro: string, hash: string): Promise<boolean>
}
