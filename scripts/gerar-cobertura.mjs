/*
 * Gera a cobertura (lcov) de forma DETERMINÍSTICA e FIEL para o SonarQube.
 *
 * Por que via build com tsc, e não `c8 node ace test`?
 *  - O c8 coleta cobertura do V8 por URL de script. Rodando via `node ace test`,
 *    o domínio é transpilado em memória num subprocesso que não herda
 *    `NODE_V8_COVERAGE` -> cobertura 0% não-determinística (race no Windows).
 *  - Compilar com swc (`node ace build`) resolve o determinismo, mas os
 *    sourcemaps do swc têm baixa fidelidade de linha e SUBCONTAM ~metade
 *    (ex.: construtor de `ordem-servico.ts` aparece como não coberto).
 *
 * Solução: compilar com `tsc` (sourcemaps fiéis 1:1) para `build-cov/` e rodar
 * a suíte a partir dali sob o c8. O V8 registra os .js com URL file:// e o c8
 * remapeia para os .ts via sourcemap. Estável E preciso (~95% no domínio).
 *
 * Observação: a suíte é executada com cwd = build-cov para que o Japa encontre
 * os *.spec.js compilados (e não os *.spec.ts da raiz).
 */
import { spawnSync } from 'node:child_process'
import { rmSync, existsSync, readFileSync, writeFileSync, copyFileSync, mkdirSync } from 'node:fs'

const DIR = 'build-cov'
const LCOV_SRC = `${DIR}/coverage/lcov.info`
const LCOV_DST = 'coverage/lcov.info'
const win = process.platform === 'win32'

function exec(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { stdio: 'inherit', shell: win, ...opts })
  if (r.status !== 0 && !opts.tolerante) {
    console.error(`ERRO: comando falhou (${cmd} ${args.join(' ')})`)
    process.exit(r.status ?? 1)
  }
}

// 1. Compila o projeto com tsc para build-cov/ (sourcemaps fiéis).
//    O tsc sobrescreve no lugar; só tentamos limpar (ignorando lock transitório
//    do Windows/AV sobre o diretório recém-escrito).
console.log('==> Compilando com tsc (sourcemaps fiéis) -> build-cov/ ...')
try {
  rmSync(DIR, { recursive: true, force: true })
} catch {
  console.warn(`==> Aviso: não foi possível limpar ${DIR}/ (em uso); tsc vai sobrescrever.`)
}
// --removeComments=false preserva as diretivas `/* c8 ignore */` no JS gerado.
exec('npx', [
  'tsc',
  '--outDir',
  DIR,
  '--sourceMap',
  '--declaration',
  'false',
  '--removeComments',
  'false',
])

// 2. O entrypoint de teste usa build-cov/ como app root.
copyFileSync('package.json', `${DIR}/package.json`)
if (existsSync('.env')) copyFileSync('.env', `${DIR}/.env`)
// .env.test ativa o SQLite em memória para as suítes integration/functional.
if (existsSync('.env.test')) copyFileSync('.env.test', `${DIR}/.env.test`)

// 3. Roda TODAS as suítes a partir do build-cov sob o c8 (cwd = build-cov):
//    unit (sem banco) + integration e functional (SQLite em memória), para uma
//    cobertura honesta de todas as camadas. Exit code != 0 é espúrio (um teste
//    exercita um erro proposital -> stderr); a validação real é sobre o lcov.
console.log('==> Coletando cobertura a partir do build-cov...')
exec(
  'npx',
  [
    'c8',
    '--all=false',
    '--check-coverage=false',
    '--reporter=lcovonly',
    '--reporter=text-summary',
    '--include=app/**',
    '--exclude=**/*.map',
    'node',
    'bin/test.js',
    'unit',
    'integration',
    'functional',
  ],
  { cwd: DIR, tolerante: true }
)

// 4. Valida o lcov, aplica o gate de cobertura de linha, normaliza os caminhos
//    (../app\... -> app/...) e move para ./coverage.
const LIMITE_LINHAS = 99 // gate: a cobertura de linha não pode regredir abaixo disto
if (!existsSync(LCOV_SRC)) {
  console.error('ERRO: lcov não gerado.')
  process.exit(1)
}
const bruto = readFileSync(LCOV_SRC, 'utf8')
const totalLinhas = (bruto.match(/^DA:/gm) ?? []).length
const cobertas = (bruto.match(/^DA:\d+,[1-9]/gm) ?? []).length
const pct = totalLinhas === 0 ? 0 : (100 * cobertas) / totalLinhas
console.log(`==> Cobertura de linha: ${pct.toFixed(2)}% (${cobertas}/${totalLinhas})`)
if (pct < LIMITE_LINHAS) {
  console.error(`ERRO: cobertura de linha ${pct.toFixed(2)}% abaixo do gate de ${LIMITE_LINHAS}%.`)
  process.exit(1)
}

const normalizado = bruto.replace(/^SF:(.*)$/gm, (_, p) => {
  const limpo = p.replace(/\\/g, '/').replace(/^(\.\.\/)+/, '')
  return 'SF:' + limpo
})
mkdirSync('coverage', { recursive: true })
writeFileSync(LCOV_DST, normalizado)
console.log(`==> Cobertura gerada em ${LCOV_DST}.`)
