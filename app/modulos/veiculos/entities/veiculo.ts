import { RaizAgregado } from '#shared/entities/raiz-agregado'
import { ErroDeValidacao } from '#shared/entities/erros'
import { Placa } from './objetos-de-valor/placa.js'
import { VeiculoCadastrado } from './eventos/veiculo-cadastrado.js'
import { VeiculoVinculadoAoCliente } from './eventos/veiculo-vinculado-ao-cliente.js'

interface PropsVeiculo {
  id?: string
  clienteId: string
  placa: Placa
  marca: string
  modelo: string
  ano: number
}

/** Veículo de um cliente. Aggregate root do contexto de Veículos. */
export class Veiculo extends RaizAgregado {
  private _clienteId: string
  private _placa: Placa
  private _marca: string
  private _modelo: string
  private _ano: number

  private constructor(props: PropsVeiculo) {
    super(props.id)
    Veiculo.validarAno(props.ano)
    this._clienteId = props.clienteId
    this._placa = props.placa
    this._marca = props.marca
    this._modelo = props.modelo
    this._ano = props.ano
  }

  static criar(props: Omit<PropsVeiculo, 'id'>): Veiculo {
    const veiculo = new Veiculo(props)
    veiculo.registrarEvento(new VeiculoCadastrado(veiculo.id, veiculo.clienteId))
    veiculo.registrarEvento(new VeiculoVinculadoAoCliente(veiculo.id, veiculo.clienteId))
    return veiculo
  }

  static reconstituir(props: PropsVeiculo & { id: string }): Veiculo {
    return new Veiculo(props)
  }

  /** Vincula (ou transfere) o veículo a um cliente. */
  vincularCliente(clienteId: string): void {
    if (!clienteId || clienteId.trim().length === 0) {
      throw new ErroDeValidacao('Cliente é obrigatório para vincular o veículo.')
    }
    if (clienteId === this._clienteId) return
    this._clienteId = clienteId
    this.registrarEvento(new VeiculoVinculadoAoCliente(this.id, clienteId))
  }

  atualizar(dados: { marca?: string; modelo?: string; ano?: number }): void {
    if (dados.ano !== undefined) {
      Veiculo.validarAno(dados.ano)
      this._ano = dados.ano
    }
    if (dados.marca !== undefined) this._marca = dados.marca
    if (dados.modelo !== undefined) this._modelo = dados.modelo
  }

  private static validarAno(ano: number): void {
    const anoAtual = new Date().getFullYear()
    if (!Number.isInteger(ano) || ano < 1900 || ano > anoAtual + 1) {
      throw new ErroDeValidacao(`Ano do veículo inválido: ${ano}`)
    }
  }

  get clienteId(): string {
    return this._clienteId
  }

  get placa(): Placa {
    return this._placa
  }

  get marca(): string {
    return this._marca
  }

  get modelo(): string {
    return this._modelo
  }

  get ano(): number {
    return this._ano
  }
}
