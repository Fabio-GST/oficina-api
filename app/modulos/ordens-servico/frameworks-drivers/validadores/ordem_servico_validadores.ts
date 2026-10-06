import vine from '@vinejs/vine'
import { StatusOS } from '../../entities/objetos-de-valor/status-ordem-servico.js'
import { PrioridadeOS } from '../../entities/objetos-de-valor/prioridade-os.js'

export const criarOrdemServicoValidator = vine.compile(
  vine.object({
    clienteId: vine.string().trim().uuid(),
    veiculoId: vine.string().trim().uuid(),
    prioridade: vine.enum(Object.values(PrioridadeOS)).optional(),
    servicos: vine
      .array(
        vine.object({
          servicoId: vine.string().trim().uuid(),
          quantidade: vine.number().min(1),
        })
      )
      .optional(),
    pecas: vine
      .array(
        vine.object({
          pecaId: vine.string().trim().uuid(),
          quantidade: vine.number().min(1),
        })
      )
      .optional(),
  })
)

export const adicionarServicoValidator = vine.compile(
  vine.object({
    servicoId: vine.string().trim().uuid(),
    quantidade: vine.number().min(1),
  })
)

export const adicionarPecaValidator = vine.compile(
  vine.object({
    pecaId: vine.string().trim().uuid(),
    quantidade: vine.number().min(1),
  })
)

export const alterarStatusValidator = vine.compile(
  vine.object({
    status: vine.enum(Object.values(StatusOS)),
  })
)

export const decisaoOrcamentoValidator = vine.compile(
  vine.object({
    decisao: vine.enum(['APROVADO', 'RECUSADO'] as const),
  })
)
