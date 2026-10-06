import vine from '@vinejs/vine'

export const registrarAdministradorValidator = vine.compile(
  vine.object({
    nome: vine.string().trim().minLength(2).maxLength(120),
    email: vine.string().trim().email(),
    senha: vine.string().minLength(8).maxLength(72),
  })
)

export const autenticarValidator = vine.compile(
  vine.object({
    email: vine.string().trim().email(),
    senha: vine.string(),
  })
)
