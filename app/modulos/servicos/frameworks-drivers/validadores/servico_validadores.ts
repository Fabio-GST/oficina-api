import vine from '@vinejs/vine'

export const criarServicoValidator = vine.compile(
  vine.object({
    nome: vine.string().trim().minLength(2).maxLength(120),
    descricao: vine.string().trim().maxLength(500).nullable().optional(),
    preco: vine.number().min(0),
    tempoEstimadoMinutos: vine.number().min(1).nullable().optional(),
  })
)

export const atualizarServicoValidator = vine.compile(
  vine.object({
    nome: vine.string().trim().minLength(2).maxLength(120).optional(),
    descricao: vine.string().trim().maxLength(500).nullable().optional(),
    preco: vine.number().min(0).optional(),
  })
)

export const definirTempoEstimadoValidator = vine.compile(
  vine.object({
    tempoEstimadoMinutos: vine.number().min(1),
  })
)
