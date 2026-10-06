import path from 'node:path'
import url from 'node:url'

/**
 * Configuração do adonis-autoswagger. Gera a especificação OpenAPI a partir das
 * rotas e dos comentários dos controllers, servida em `/docs` (Swagger UI).
 */
const descricaoLinguagemUbiqua = `
MVP do **Sistema Integrado de Atendimento e Execução de Serviços** de uma oficina mecânica.
As URLs REST seguem convenção em inglês; o domínio e esta documentação usam a **Linguagem Ubíqua** em português.

## Agregados e entidades

| Termo | Descrição |
| --- | --- |
| **OrdemServico (OS)** | Raiz de agregado central; ciclo de vida com máquina de estados |
| **ItemOrdemServico** | Linha de serviço ou peça dentro da OS |
| **Cliente** | Dono do veículo; identificado por **Documento** (CPF/CNPJ) |
| **Veiculo** | Identificado por **Placa**; vinculável a um Cliente |
| **Servico** | Item de catálogo (preço, tempo estimado, ativo/inativo) |
| **Peca** | Insumo de estoque com reserva e baixa |
| **SolicitacaoDeCompra** | Pedido ao fornecedor quando o estoque está abaixo do mínimo |
| **Pagamento / Cobrança** | Financeiro da OS (desconto, quitação, Nota Fiscal) |
| **Usuario** | Operador administrativo do sistema (autenticação JWT) |

## Objetos de valor

**Documento** (CPF/CNPJ) · **Placa** · **Dinheiro** · **StatusOrdemServico** · **PrioridadeOS** · **QuantidadeEstoque**

## Ciclo de vida da Ordem de Serviço

\`RECEBIDA\` → \`EM_DIAGNOSTICO\` → \`AGUARDANDO_APROVACAO\` → (\`EM_EXECUCAO\` | \`RECUSADA\` | renegociação volta a \`EM_DIAGNOSTICO\`) → \`FINALIZADA\` → \`ENTREGUE\`

Prioridades: \`NORMAL\`, \`ALTA\`. Status de pagamento: \`PENDENTE\`, \`PARCIAL\`, \`QUITADO\`.

## Mapeamento rota → domínio

| Rota | Conceito de domínio |
| --- | --- |
| \`/customers\` | Cliente |
| \`/vehicles\` | Veículo |
| \`/services\` | Serviço |
| \`/parts\` | Peça / Insumo |
| \`/purchase-orders\` | Solicitação de Compra |
| \`/work-orders\` | Ordem de Serviço |
| \`/work-orders/:id/tracking\` | Acompanhamento da OS (público) |
| \`/payments\` | Pagamento / Cobrança |
| \`/auth/*\`, \`/me\` | Usuário / Autenticação |
| \`/metrics/average-execution-time\` | Tempo médio de execução das OS |

## Autenticação

Rotas administrativas exigem **JWT Bearer** (\`Authorization: Bearer <token>\`).
Obtenha o token em \`POST /auth/login\`. Exceção pública: \`GET /work-orders/:id/tracking\`.

## Códigos de erro

| Código | Significado |
| --- | --- |
| \`RECURSO_NAO_ENCONTRADO\` | Entidade inexistente |
| \`VALIDACAO\` | Dados de entrada inválidos |
| \`REGRA_DE_NEGOCIO_VIOLADA\` | Transição ou operação não permitida no domínio |
| \`CONFLITO_DE_RECURSO\` | Duplicidade (ex.: documento ou placa já cadastrados) |
`.trim()

export default {
  path: path.dirname(url.fileURLToPath(import.meta.url)) + '/../',
  title: 'API - Oficina Mecânica',
  version: '1.0.0',
  description: descricaoLinguagemUbiqua,
  tagIndex: 2,
  snakeCase: true,
  ignore: ['/swagger', '/docs', '/', '/health'],
  preferredPutPatch: 'PUT',
  common: {
    parameters: {},
    headers: {},
  },
  securitySchemes: {
    BearerAuth: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    },
  },
  authMiddlewares: ['auth'],
  defaultSecurityScheme: 'BearerAuth',
  persistAuthorization: true,
}
