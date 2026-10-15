import jwt from 'jsonwebtoken'
import { test } from '@japa/runner'
import env from '#start/env'
import { ALGORITMO_JWT, servicoJwt } from '#shared/frameworks-drivers/jwt/servico-jwt'
import { NaoAutenticado } from '#shared/entities/erros'

/**
 * Emite o token exatamente como a Function de autenticação por CPF (repo
 * oficina-auth-lambda) emitirá: HS256 com o `JWT_SECRET` compartilhado e as
 * claims `sub` (id do cliente), `cpf`, `papel: 'cliente'` e `exp`.
 *
 * Se este helper mudar, a implementação da Lambda precisa mudar junto — e
 * vice-versa. É o teste de contrato entre os dois repositórios.
 */
function emitirComoALambda(cliente: { id: string; cpf: string }, segredo = env.get('JWT_SECRET')) {
  return jwt.sign({ sub: cliente.id, cpf: cliente.cpf, papel: 'cliente' }, segredo, {
    algorithm: 'HS256',
    expiresIn: '1h',
  })
}

test.group('Contrato do JWT com a Function de autenticação por CPF', () => {
  test('o algoritmo acordado é HS256', ({ assert }) => {
    assert.equal(ALGORITMO_JWT, 'HS256')
  })

  test('token emitido como a Lambda é aceito e expõe sub, cpf e papel cliente', ({ assert }) => {
    const token = emitirComoALambda({ id: 'cliente-123', cpf: '11144477735' })

    const conteudo = servicoJwt.verificar(token)

    assert.equal(conteudo.sub, 'cliente-123')
    assert.equal(conteudo.cpf, '11144477735')
    assert.equal(conteudo.papel, 'cliente')
    assert.isUndefined(conteudo.email)
  })

  test('as claims do token são exatamente sub, cpf, papel, iat e exp', ({ assert }) => {
    const token = emitirComoALambda({ id: 'cliente-123', cpf: '11144477735' })
    const payload = jwt.decode(token) as Record<string, unknown>

    assert.sameMembers(Object.keys(payload), ['sub', 'cpf', 'papel', 'iat', 'exp'])
    assert.isNumber(payload.exp)
  })

  test('token do administrador emitido pela API carrega papel admin', ({ assert }) => {
    const token = servicoJwt.emitir({
      sub: 'admin-1',
      papel: 'admin',
      nome: 'Admin',
      email: 'admin@oficina.test',
    })
    const payload = jwt.decode(token, { complete: true })!

    assert.equal(payload.header.alg, 'HS256')
    assert.equal(servicoJwt.verificar(token).papel, 'admin')
  })

  test('token assinado com outro segredo é recusado', ({ assert }) => {
    const token = emitirComoALambda({ id: 'cliente-123', cpf: '11144477735' }, 'outro-segredo')
    assert.throws(() => servicoJwt.verificar(token), NaoAutenticado)
  })

  test('token assinado com outro algoritmo é recusado', ({ assert }) => {
    const token = jwt.sign({ sub: 'x', papel: 'cliente' }, env.get('JWT_SECRET'), {
      algorithm: 'HS512',
    })
    assert.throws(() => servicoJwt.verificar(token), NaoAutenticado)
  })

  test('token sem papel reconhecido é recusado', ({ assert }) => {
    const semPapel = jwt.sign({ sub: 'x' }, env.get('JWT_SECRET'), { algorithm: 'HS256' })
    const papelDesconhecido = jwt.sign({ sub: 'x', papel: 'root' }, env.get('JWT_SECRET'), {
      algorithm: 'HS256',
    })
    assert.throws(() => servicoJwt.verificar(semPapel), NaoAutenticado)
    assert.throws(() => servicoJwt.verificar(papelDesconhecido), NaoAutenticado)
  })

  test('token expirado é recusado', ({ assert }) => {
    const token = jwt.sign({ sub: 'x', papel: 'cliente' }, env.get('JWT_SECRET'), {
      algorithm: 'HS256',
      expiresIn: -10,
    })
    assert.throws(() => servicoJwt.verificar(token), NaoAutenticado)
  })
})
