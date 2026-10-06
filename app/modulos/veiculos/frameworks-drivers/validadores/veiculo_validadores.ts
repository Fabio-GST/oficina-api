import vine from '@vinejs/vine'

const anoMaximo = new Date().getFullYear() + 1

export const criarVeiculoValidator = vine.compile(
  vine.object({
    clienteId: vine.string().trim().uuid(),
    placa: vine.string().trim().minLength(7).maxLength(8),
    marca: vine.string().trim().minLength(1).maxLength(60),
    modelo: vine.string().trim().minLength(1).maxLength(60),
    ano: vine.number().min(1900).max(anoMaximo),
  })
)

export const atualizarVeiculoValidator = vine.compile(
  vine.object({
    marca: vine.string().trim().minLength(1).maxLength(60).optional(),
    modelo: vine.string().trim().minLength(1).maxLength(60).optional(),
    ano: vine.number().min(1900).max(anoMaximo).optional(),
  })
)

export const vincularClienteValidator = vine.compile(
  vine.object({
    clienteId: vine.string().trim().uuid(),
  })
)
