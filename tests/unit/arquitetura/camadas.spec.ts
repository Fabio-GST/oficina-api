import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { test } from '@japa/runner'

/**
 * Teste de arquitetura (rede dupla do eslint-plugin-boundaries): varre os
 * imports de `app/` e assere a regra de dependência do Clean Architecture.
 * Se este teste falhar, alguma camada interna passou a conhecer uma externa
 * ou um módulo furou o bounded context sem passar por um adapter ACL.
 */
const RAIZ = join(import.meta.dirname, '..', '..', '..', 'app')

function arquivosTs(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true, recursive: true })
    .filter((e) => e.isFile() && e.name.endsWith('.ts'))
    .map((e) => join(e.parentPath, e.name))
}

function importsDe(arquivo: string): string[] {
  const conteudo = readFileSync(arquivo, 'utf8')
  return [...conteudo.matchAll(/from '([^']+)'/g)].map((m) => m[1])
}

interface Violacao {
  arquivo: string
  importado: string
  regra: string
}

function coletarViolacoes(): Violacao[] {
  const violacoes: Violacao[] = []

  const registrar = (arquivo: string, importado: string, regra: string) =>
    violacoes.push({ arquivo: relative(RAIZ, arquivo).replaceAll('\\', '/'), importado, regra })

  for (const arquivo of arquivosTs(join(RAIZ, 'modulos'))) {
    const caminho = relative(join(RAIZ, 'modulos'), arquivo).replaceAll('\\', '/')
    const [modulo, camada] = caminho.split('/')
    const ehAcl = caminho.includes('interface-adapters/gateways/acl/')

    for (const imp of importsDe(arquivo)) {
      const outroModulo = /^#modulos\/([^/]+)\//.exec(imp)?.[1]

      if (camada === 'entities') {
        if (
          /@adonisjs|@vinejs|#shared\/(use-cases|interface-adapters|frameworks-drivers)/.test(imp)
        )
          registrar(arquivo, imp, 'entities não conhece camadas externas')
        if (/use-cases|interface-adapters|frameworks-drivers/.test(imp))
          registrar(arquivo, imp, 'entities não conhece camadas externas')
        if (outroModulo && outroModulo !== modulo)
          registrar(arquivo, imp, 'entities não cruza bounded contexts')
      }

      if (camada === 'use-cases') {
        if (/@adonisjs|@vinejs|#shared\/(interface-adapters|frameworks-drivers)/.test(imp))
          registrar(arquivo, imp, 'use-cases não conhece infraestrutura')
        if (/interface-adapters|frameworks-drivers/.test(imp))
          registrar(arquivo, imp, 'use-cases não conhece infraestrutura')
        if (outroModulo && outroModulo !== modulo)
          registrar(arquivo, imp, 'use-cases não cruza bounded contexts (use um adapter ACL)')
      }

      if (camada === 'interface-adapters' && !ehAcl) {
        if (outroModulo && outroModulo !== modulo)
          registrar(arquivo, imp, 'somente adapters ACL cruzam bounded contexts')
      }
    }
  }

  for (const arquivo of arquivosTs(join(RAIZ, 'politicas'))) {
    for (const imp of importsDe(arquivo)) {
      if (/@adonisjs|@vinejs|interface-adapters|frameworks-drivers/.test(imp))
        registrar(arquivo, imp, 'políticas vivem no anel de use cases')
    }
  }

  return violacoes
}

test.group('Arquitetura — regra de dependência', () => {
  test('nenhuma camada interna importa uma externa; módulos só se cruzam via ACL', ({ assert }) => {
    assert.deepEqual(coletarViolacoes(), [])
  })
})
