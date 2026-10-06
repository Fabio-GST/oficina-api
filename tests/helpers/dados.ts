/**
 * Geradores de dados válidos para os testes.
 */

function digitoVerificador(numeros: number[]): number {
  const fator = numeros.length + 1
  const soma = numeros.reduce((acc, d, i) => acc + d * (fator - i), 0)
  const resto = (soma * 10) % 11
  return resto === 10 ? 0 : resto
}

/** Gera um CPF válido (11 dígitos, apenas números) com dígitos verificadores corretos. */
export function gerarCpf(): string {
  const base = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10))
  const d1 = digitoVerificador(base)
  const d2 = digitoVerificador([...base, d1])
  return [...base, d1, d2].join('')
}
