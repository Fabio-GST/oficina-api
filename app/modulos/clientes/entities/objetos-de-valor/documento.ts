import { ObjetoDeValor } from '#shared/entities/objeto-de-valor'
import { ErroDeValidacao } from '#shared/entities/erros'

export type TipoDocumento = 'CPF' | 'CNPJ'

interface PropsDocumento {
  valor: string
  tipo: TipoDocumento
}

/**
 * Documento de identificação do cliente: CPF (11 dígitos) ou CNPJ (14 dígitos),
 * validado pelos dígitos verificadores. Armazenado apenas com os números.
 */
export class Documento extends ObjetoDeValor<PropsDocumento> {
  private constructor(props: PropsDocumento) {
    super(props)
  }

  static criar(valor: string): Documento {
    const numeros = (valor ?? '').replace(/\D/g, '')

    if (numeros.length === 11) {
      if (!Documento.cpfValido(numeros)) {
        throw new ErroDeValidacao(`CPF inválido: ${valor}`)
      }
      return new Documento({ valor: numeros, tipo: 'CPF' })
    }

    if (numeros.length === 14) {
      if (!Documento.cnpjValido(numeros)) {
        throw new ErroDeValidacao(`CNPJ inválido: ${valor}`)
      }
      return new Documento({ valor: numeros, tipo: 'CNPJ' })
    }

    throw new ErroDeValidacao(`Documento inválido (esperado CPF ou CNPJ): ${valor}`)
  }

  get valor(): string {
    return this.props.valor
  }

  get tipo(): TipoDocumento {
    return this.props.tipo
  }

  private static cpfValido(cpf: string): boolean {
    if (/^(\d)\1{10}$/.test(cpf)) return false

    const calc = (qtd: number): number => {
      let soma = 0
      for (let i = 0; i < qtd; i++) {
        soma += Number(cpf[i]) * (qtd + 1 - i)
      }
      const resto = (soma * 10) % 11
      return resto === 10 ? 0 : resto
    }

    return calc(9) === Number(cpf[9]) && calc(10) === Number(cpf[10])
  }

  private static cnpjValido(cnpj: string): boolean {
    if (/^(\d)\1{13}$/.test(cnpj)) return false

    const calc = (qtd: number): number => {
      const pesos =
        qtd === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
      let soma = 0
      for (let i = 0; i < qtd; i++) {
        soma += Number(cnpj[i]) * pesos[i]
      }
      const resto = soma % 11
      return resto < 2 ? 0 : 11 - resto
    }

    return calc(12) === Number(cnpj[12]) && calc(13) === Number(cnpj[13])
  }
}
