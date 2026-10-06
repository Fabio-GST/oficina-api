# Relatório de Análise de Vulnerabilidades

Este relatório documenta a análise de segurança do projeto, incluindo o scan de dependências e
os controles de segurança implementados na aplicação.

- **Projeto:** API - Oficina Mecânica (Tech Challenge - Fase 1)
- **Ferramenta de scan:** `npm audit` (base de advisories do npm / GitHub Advisory Database)
- **Data da análise:** 2026-06-20

---

## 1. Scan de dependências (`npm audit`)

Comando executado:

```bash
npm audit
```

### Resumo

| Severidade | Quantidade |
| ---------- | ---------- |
| Crítica    | 0          |
| Alta       | 0          |
| Moderada   | 6          |
| Baixa      | 0          |

### Detalhamento

Todas as 6 ocorrências moderadas têm a **mesma origem**: o advisory de **Open Redirect** em
`@adonisjs/http-server` (dependência transitiva de `@adonisjs/core < 7.3.1`).

| Pacote                  | Origem                | Severidade | Advisory                                                                                                            |
| ----------------------- | --------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------- |
| `@adonisjs/core`        | direta                | Moderada   | [GHSA-6qvv-pj99-48qm](https://github.com/advisories/GHSA-6qvv-pj99-48qm) — Open Redirect no `@adonisjs/http-server` |
| `@adonisjs/auth`        | transitiva (core)     | Moderada   | herda do advisory acima                                                                                             |
| `@adonisjs/lucid`       | transitiva (core)     | Moderada   | herda do advisory acima                                                                                             |
| `@adonisjs/cors`        | transitiva (core)     | Moderada   | herda do advisory acima                                                                                             |
| `@adonisjs/presets`     | transitiva (core)     | Moderada   | herda do advisory acima                                                                                             |
| `@japa/plugin-adonisjs` | transitiva (core/dev) | Moderada   | herda do advisory acima                                                                                             |

### Análise de impacto

- **Natureza:** Open Redirect — um endpoint que redireciona o usuário pode ser induzido a
  apontar para um destino externo controlado por um atacante (útil em phishing).
- **Exposição neste projeto:** **baixa**. A API é **RESTful e stateless** (retorna JSON), **não
  usa redirecionamentos** em seus fluxos e a resposta padrão é forçada para JSON
  (`force_json_response_middleware`). Não há rotas que utilizem `response.redirect()` com
  destino derivado de entrada do usuário.
- **Correção disponível:** `npm audit fix --force` instalaria `@adonisjs/core@7.3.4`, que é uma
  **major version** (mudança potencialmente quebrante).

### Recomendações

1. **Curto prazo:** manter o monitoramento; risco residual baixo, pois a aplicação não realiza
   redirecionamentos.
2. **Médio prazo:** planejar a atualização para `@adonisjs/core >= 7.3.1` (validando as
   mudanças de major), eliminando o advisory na raiz da árvore de dependências.
3. **Contínuo:** integrar o `npm audit` (ou um scanner como `osv-scanner`/Snyk) ao pipeline de
   CI, falhando o build em vulnerabilidades **altas/críticas**.

---

## 2. Controles de segurança implementados na aplicação

| Controle                      | Implementação                                                                  |
| ----------------------------- | ------------------------------------------------------------------------------ |
| Autenticação                  | **JWT** (`Authorization: Bearer`) em todas as rotas administrativas            |
| Armazenamento de senhas       | **Hash** com scrypt (serviço de hash do AdonisJS) — texto puro nunca persiste  |
| Validação de entrada          | **VineJS** em todos os endpoints (tipos, tamanhos, formatos)                   |
| Validação de dados sensíveis  | Dígitos verificadores de **CPF/CNPJ** e formato de **placa** no domínio        |
| Segredos por ambiente         | `JWT_SECRET`, `APP_KEY` e credenciais via variáveis de ambiente (`.env`)       |
| Superfície de erro controlada | Erros de domínio mapeados para respostas HTTP padronizadas (sem stack em prod) |
| Integridade de dados          | Transações ACID (Unidade de Trabalho) e chaves estrangeiras no MySQL           |

---

## 3. Pontos de atenção / hardening recomendado

- **`JWT_SECRET` e `APP_KEY`:** trocar por segredos fortes e exclusivos em produção (os valores
  do `.env.example` são apenas para desenvolvimento).
- **Cadastro de administradores:** o endpoint `POST /auth/register` é protegido por JWT (apenas
  administradores autenticados criam novos administradores); o primeiro admin é criado via seed.
- **Rate limiting / brute force:** considerar limitar tentativas de login em produção.
- **CORS:** revisar a política em `config/cors.ts` para restringir as origens permitidas.
- **HTTPS:** terminar TLS na borda (proxy reverso) em produção.
