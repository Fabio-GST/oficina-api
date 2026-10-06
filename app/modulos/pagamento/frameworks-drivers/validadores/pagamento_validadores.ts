import vine from '@vinejs/vine'

export const gerarCobrancaValidator = vine.compile(
  vine.object({
    total: vine.number().min(0.01),
  })
)

export const aplicarDescontoValidator = vine.compile(
  vine.object({
    desconto: vine.number().min(0),
  })
)

export const registrarPagamentoValidator = vine.compile(
  vine.object({
    valor: vine.number().min(0.01),
  })
)
