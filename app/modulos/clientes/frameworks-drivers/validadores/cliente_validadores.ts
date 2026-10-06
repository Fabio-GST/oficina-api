import vine from '@vinejs/vine'

export const criarClienteValidator = vine.compile(
  vine.object({
    nome: vine.string().trim().minLength(2).maxLength(120),
    documento: vine.string().trim().minLength(11).maxLength(18),
    telefone: vine.string().trim().maxLength(20).nullable().optional(),
    email: vine.string().trim().email().nullable().optional(),
  })
)

export const atualizarClienteValidator = vine.compile(
  vine.object({
    nome: vine.string().trim().minLength(2).maxLength(120).optional(),
    telefone: vine.string().trim().maxLength(20).nullable().optional(),
    email: vine.string().trim().email().nullable().optional(),
  })
)
