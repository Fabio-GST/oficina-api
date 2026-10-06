import { configApp } from '@adonisjs/eslint-config'
import boundaries from 'eslint-plugin-boundaries'

/** Seletor de elemento; com `mesmoModulo`, restringe ao bounded context de origem. */
const el = (type, mesmoModulo = false) =>
  mesmoModulo ? { type, captured: { modulo: '{{ from.element.captured.modulo }}' } } : { type }

/** Uma policy de permissão por destino (default é disallow). */
const permitir = (deTipo, destinos) =>
  destinos.map((destino) => ({
    from: { element: { type: deTipo } },
    allow: { to: { element: destino } },
  }))

export default configApp(
  {
    rules: {
      /**
       * Os arquivos das camadas de domínio/aplicação usam kebab-case (convenção
       * adotada no projeto para DDD); os arquivos gerenciados pelo Adonis (models,
       * controllers, middleware) permanecem em snake_case. Permitimos ambos.
       */
      '@unicorn/filename-case': ['error', { cases: { snakeCase: true, kebabCase: true } }],
    },
  },
  {
    /**
     * Guardas de arquitetura (Clean Architecture): a regra de dependência é
     * verificada pelo lint. Os elementos são as camadas de cada módulo; a
     * captura `modulo` restringe imports ao próprio bounded context — o acesso
     * a outro contexto só é permitido a partir dos adapters ACL e do anel de
     * frameworks (composition root).
     */
    files: ['app/**/*.ts'],
    plugins: { boundaries },
    settings: {
      'boundaries/elements': [
        { type: 'shared-entities', pattern: 'app/shared/entities/**' },
        { type: 'shared-use-cases', pattern: 'app/shared/use-cases/**' },
        { type: 'shared-adapters', pattern: 'app/shared/interface-adapters/**' },
        { type: 'shared-frameworks', pattern: 'app/shared/frameworks-drivers/**' },
        {
          type: 'acl',
          pattern: 'app/modulos/*/interface-adapters/gateways/acl/**',
          capture: ['modulo'],
        },
        { type: 'entities', pattern: 'app/modulos/*/entities/**', capture: ['modulo'] },
        { type: 'use-cases', pattern: 'app/modulos/*/use-cases/**', capture: ['modulo'] },
        { type: 'adapters', pattern: 'app/modulos/*/interface-adapters/**', capture: ['modulo'] },
        { type: 'frameworks', pattern: 'app/modulos/*/frameworks-drivers/**', capture: ['modulo'] },
        { type: 'politicas', pattern: 'app/politicas/**' },
        { type: 'borda', pattern: 'app/{exceptions,middleware}/**' },
      ],
      'boundaries/include': ['app/**/*.ts'],
      // Resolve os imports com sufixo .js e os subpath imports (#modulos/...)
      'import/resolver': {
        typescript: { alwaysTryTypes: true, project: './tsconfig.json' },
      },
    },
    rules: {
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          policies: [
            ...permitir('shared-entities', [el('shared-entities')]),
            ...permitir('shared-use-cases', [el('shared-use-cases'), el('shared-entities')]),
            ...permitir('shared-adapters', [el('shared-entities'), el('shared-use-cases')]),
            ...permitir('shared-frameworks', [
              el('shared-frameworks'),
              el('shared-use-cases'),
              el('shared-entities'),
            ]),
            // Entities: anel mais interno — nada além do próprio módulo e do shared puro.
            ...permitir('entities', [el('shared-entities'), el('entities', true)]),
            // Use cases: entities e portas do PRÓPRIO módulo + contratos do shared.
            ...permitir('use-cases', [
              el('shared-entities'),
              el('shared-use-cases'),
              el('entities', true),
              el('use-cases', true),
            ]),
            // Adapters ACL: único ponto dos interface-adapters autorizado a
            // depender de outro bounded context (portas/casos de uso alheios).
            ...permitir('acl', [
              el('shared-entities'),
              el('shared-use-cases'),
              el('use-cases'),
              el('entities'),
            ]),
            // Demais adapters: nunca importam nada de OUTRO módulo.
            ...permitir('adapters', [
              el('shared-entities'),
              el('shared-use-cases'),
              el('shared-adapters'),
              el('shared-frameworks'),
              el('entities', true),
              el('use-cases', true),
              el('adapters', true),
              el('frameworks', true),
            ]),
            // Frameworks & drivers: anel externo, composition root — pode tudo.
            ...permitir('frameworks', [
              el('shared-entities'),
              el('shared-use-cases'),
              el('shared-frameworks'),
              el('entities'),
              el('use-cases'),
              el('adapters'),
              el('frameworks'),
              el('acl'),
            ]),
            // Políticas: manipuladores cross-context do anel de use cases.
            ...permitir('politicas', [
              el('shared-entities'),
              el('shared-use-cases'),
              el('use-cases'),
              el('entities'),
            ]),
            // Borda HTTP (exceptions/middleware).
            ...permitir('borda', [
              el('shared-entities'),
              el('shared-use-cases'),
              el('shared-adapters'),
              el('shared-frameworks'),
              el('use-cases'),
              el('adapters'),
            ]),
          ],
        },
      ],
    },
  }
)
