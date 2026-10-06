/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| Rotas REST da API da oficina. As URLs seguem a convenção em inglês; o código
| de domínio por trás é escrito na Linguagem Ubíqua em português.
|
*/

import router from '@adonisjs/core/services/router'
import AutoSwagger from 'adonis-autoswagger'
import { middleware } from '#start/kernel'
import swagger from '#config/swagger'

const AutenticacaoController = () =>
  import('#modulos/autenticacao/interface-adapters/controllers/autenticacao_controller')
const ClientesController = () =>
  import('#modulos/clientes/interface-adapters/controllers/clientes_controller')
const VeiculosController = () =>
  import('#modulos/veiculos/interface-adapters/controllers/veiculos_controller')
const ServicosController = () =>
  import('#modulos/servicos/interface-adapters/controllers/servicos_controller')
const PecasController = () =>
  import('#modulos/estoque/interface-adapters/controllers/pecas_controller')
const OrdensServicoController = () =>
  import('#modulos/ordens-servico/interface-adapters/controllers/ordens_servico_controller')
const PagamentosController = () =>
  import('#modulos/pagamento/interface-adapters/controllers/pagamentos_controller')

router.get('/', async () => ({ servico: 'API Oficina Mecânica', documentacao: '/docs' }))
router.get('/health', async () => ({ status: 'ok' }))

/*
| Documentação OpenAPI / Swagger UI
|
| A especificação é gerada pelo adonis-autoswagger a partir das rotas e das
| anotações dos controllers e, em seguida, pós-processada para deixar TODA a
| documentação em português (Linguagem Ubíqua): descrições das seções por
| domínio, ordem dos domínios e tradução das respostas genéricas do pacote.
*/

/** Descrição de cada seção por domínio (bounded context). Chaves em MAIÚSCULAS
 *  porque o autoswagger normaliza os nomes das tags. */
const DESCRICOES_POR_DOMINIO: Record<string, string> = {
  'AUTENTICAÇÃO': 'Emissão de token JWT e cadastro de usuários administrativos.',
  'CLIENTES': 'Cadastro e consulta de clientes, identificados por CPF ou CNPJ.',
  'VEÍCULOS': 'Cadastro de veículos e vínculo com o cliente proprietário.',
  'SERVIÇOS': 'Catálogo de serviços da oficina: preço, tempo estimado e ativação.',
  'ESTOQUE': 'Peças, saldo (disponível/reservado), estoque mínimo e compras.',
  'ORDENS DE SERVIÇO':
    'Ciclo de vida da OS: abertura, orçamento, aprovação, execução, finalização e entrega.',
  'PAGAMENTOS': 'Cobrança da OS, descontos, registro de pagamentos e Nota Fiscal.',
}

const ORDEM_DOS_DOMINIOS = Object.keys(DESCRICOES_POR_DOMINIO)

router.get('/swagger', async () => {
  const doc = (await AutoSwagger.default.json(router.toJSON(), swagger)) as any

  // Deduplica as tags (o autoswagger cria uma por operação), aplica as
  // descrições em PT e ordena as seções por domínio.
  if (Array.isArray(doc.tags)) {
    const vistas = new Set<string>()
    doc.tags = doc.tags.filter((t: { name: string }) => {
      if (vistas.has(t.name)) return false
      vistas.add(t.name)
      return true
    })
    for (const tag of doc.tags) {
      if (DESCRICOES_POR_DOMINIO[tag.name]) {
        tag.description = DESCRICOES_POR_DOMINIO[tag.name]
      }
    }
    const posicao = (nome: string) => {
      const i = ORDEM_DOS_DOMINIOS.indexOf(nome)
      return i === -1 ? Number.MAX_SAFE_INTEGER : i
    }
    doc.tags.sort((a: { name: string }, b: { name: string }) => posicao(a.name) - posicao(b.name))
  }

  // Respostas genéricas do pacote (fixas em inglês) traduzidas para PT.
  const respostas = doc.components?.responses
  if (respostas) {
    const traducoes: Record<string, string> = {
      Forbidden: 'Token de acesso ausente ou inválido',
      Accepted: 'Requisição aceita',
      Created: 'Recurso criado',
      NotFound: 'Recurso não encontrado',
      NotAcceptable: 'Requisição não aceitável',
    }
    for (const [chave, descricao] of Object.entries(traducoes)) {
      if (respostas[chave]) respostas[chave].description = descricao
    }
  }

  return doc
})
router.get('/docs', async () => {
  return AutoSwagger.default.ui('/swagger', swagger)
})

/*
| Rotas públicas
*/
router.post('/auth/login', [AutenticacaoController, 'login'])
router.get('/work-orders/:id/tracking', [OrdensServicoController, 'andamento'])

/*
| Webhooks (sistemas externos, protegidos por segredo compartilhado)
*/
router
  .post('/work-orders/:id/budget-decision', [OrdensServicoController, 'decisaoOrcamento'])
  .use(middleware.webhook())

/*
| Rotas administrativas protegidas por JWT
*/
router
  .group(() => {
    router.get('/me', [AutenticacaoController, 'me'])
    router.post('/auth/register', [AutenticacaoController, 'register'])

    // Clientes
    router.get('/customers', [ClientesController, 'index'])
    router.post('/customers', [ClientesController, 'store'])
    router.get('/customers/by-document/:documento', [ClientesController, 'porDocumento'])
    router.get('/customers/:id', [ClientesController, 'show'])
    router.put('/customers/:id', [ClientesController, 'update'])
    router.delete('/customers/:id', [ClientesController, 'destroy'])

    // Veículos
    router.get('/vehicles', [VeiculosController, 'index'])
    router.post('/vehicles', [VeiculosController, 'store'])
    router.get('/vehicles/by-plate/:placa', [VeiculosController, 'porPlaca'])
    router.get('/vehicles/:id', [VeiculosController, 'show'])
    router.put('/vehicles/:id', [VeiculosController, 'update'])
    router.patch('/vehicles/:id/owner', [VeiculosController, 'vincularCliente'])
    router.delete('/vehicles/:id', [VeiculosController, 'destroy'])

    // Serviços
    router.get('/services', [ServicosController, 'index'])
    router.post('/services', [ServicosController, 'store'])
    router.get('/services/:id', [ServicosController, 'show'])
    router.put('/services/:id', [ServicosController, 'update'])
    router.patch('/services/:id/deactivate', [ServicosController, 'inativar'])
    router.patch('/services/:id/activate', [ServicosController, 'reativar'])
    router.patch('/services/:id/estimated-time', [ServicosController, 'definirTempoEstimado'])
    router.delete('/services/:id', [ServicosController, 'destroy'])

    // Peças / Estoque
    router.get('/parts', [PecasController, 'index'])
    router.post('/parts', [PecasController, 'store'])
    router.get('/parts/:id', [PecasController, 'show'])
    router.put('/parts/:id', [PecasController, 'update'])
    router.patch('/parts/:id/stock', [PecasController, 'ajustarEstoque'])
    router.patch('/parts/:id/minimum-stock', [PecasController, 'definirEstoqueMinimo'])
    router.post('/parts/:id/reservations', [PecasController, 'reservar'])
    router.post('/parts/:id/usage', [PecasController, 'utilizar'])
    router.post('/parts/:id/purchase-orders', [PecasController, 'solicitarCompra'])
    router.post('/purchase-orders/:id/receive', [PecasController, 'receberCompra'])
    router.delete('/parts/:id', [PecasController, 'destroy'])

    // Ordens de Serviço
    router.get('/work-orders', [OrdensServicoController, 'index'])
    router.post('/work-orders', [OrdensServicoController, 'store'])
    router.get('/work-orders/:id', [OrdensServicoController, 'show'])
    router.post('/work-orders/:id/services', [OrdensServicoController, 'adicionarServico'])
    router.post('/work-orders/:id/parts', [OrdensServicoController, 'adicionarPeca'])
    router.patch('/work-orders/:id/status', [OrdensServicoController, 'alterarStatus'])
    router.post('/work-orders/:id/diagnosis', [OrdensServicoController, 'iniciarDiagnostico'])
    router.post('/work-orders/:id/quote', [OrdensServicoController, 'gerarOrcamento'])
    router.post('/work-orders/:id/approval', [OrdensServicoController, 'aprovar'])
    router.post('/work-orders/:id/refusal', [OrdensServicoController, 'recusar'])
    router.post('/work-orders/:id/renegotiation', [OrdensServicoController, 'renegociar'])
    router.post('/work-orders/:id/completion', [OrdensServicoController, 'finalizar'])
    router.post('/work-orders/:id/delivery', [OrdensServicoController, 'entregar'])

    // Pagamentos
    router.post('/work-orders/:id/charge', [PagamentosController, 'gerarCobranca'])
    router.get('/payments/:id', [PagamentosController, 'show'])
    router.post('/payments/:id/discount', [PagamentosController, 'aplicarDesconto'])
    router.post('/payments/:id/payment', [PagamentosController, 'registrarPagamento'])
    router.post('/payments/:id/invoice', [PagamentosController, 'emitirNotaFiscal'])

    // Métricas
    router.get('/metrics/average-execution-time', [OrdensServicoController, 'tempoMedioExecucao'])
  })
  .use(middleware.auth())
