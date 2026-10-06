import vine from '@vinejs/vine'

export const criarPecaValidator = vine.compile(
  vine.object({
    nome: vine.string().trim().minLength(2).maxLength(120),
    descricao: vine.string().trim().maxLength(500).nullable().optional(),
    preco: vine.number().min(0),
    quantidadeEstoque: vine.number().min(0),
    estoqueMinimo: vine.number().min(0).optional(),
  })
)

export const atualizarPecaValidator = vine.compile(
  vine.object({
    nome: vine.string().trim().minLength(2).maxLength(120).optional(),
    descricao: vine.string().trim().maxLength(500).nullable().optional(),
    preco: vine.number().min(0).optional(),
  })
)

export const ajustarEstoqueValidator = vine.compile(
  vine.object({
    quantidade: vine.number().min(0),
  })
)

export const movimentarEstoqueValidator = vine.compile(
  vine.object({
    quantidade: vine.number().min(1),
  })
)

export const definirEstoqueMinimoValidator = vine.compile(
  vine.object({
    estoqueMinimo: vine.number().min(0),
  })
)

export const solicitarCompraValidator = vine.compile(
  vine.object({
    quantidade: vine.number().min(1),
  })
)
