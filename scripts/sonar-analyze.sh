#!/usr/bin/env bash
#
# Orquestra a análise do SonarQube de ponta a ponta:
#   1. aguarda o SonarQube ficar UP
#   2. troca a senha inicial do admin (admin -> $SONAR_ADMIN_PASSWORD)
#   3. gera um token de análise
#   4. gera a cobertura (lcov) e roda o scanner
#
# Uso: bash scripts/sonar-analyze.sh
# Requer: docker, curl e a stack já no ar (docker compose -f docker-compose.sonar.yml up -d).
set -euo pipefail

SONAR_URL="${SONAR_URL:-http://localhost:9000}"
SONAR_ADMIN_PASSWORD="${SONAR_ADMIN_PASSWORD:-Admin12345!}"
TOKEN_NAME="ci-$(date +%s)"

echo "==> Aguardando o SonarQube ($SONAR_URL) ficar disponível..."
for _ in $(seq 1 60); do
  status="$(curl -s "$SONAR_URL/api/system/status" | grep -o '"status":"[A-Z]*"' || true)"
  if [ "$status" = '"status":"UP"' ]; then
    echo "    SonarQube UP."
    break
  fi
  sleep 5
done

# Troca a senha inicial (idempotente: ignora erro se já trocada).
echo "==> Garantindo a senha do admin..."
curl -s -u admin:admin -X POST "$SONAR_URL/api/users/change_password" \
  -d "login=admin&previousPassword=admin&password=$SONAR_ADMIN_PASSWORD" >/dev/null 2>&1 || true

# Gera o token de análise (usa a senha nova; cai para admin:admin se ainda não trocada).
echo "==> Gerando token de análise ($TOKEN_NAME)..."
resp="$(curl -s -u "admin:$SONAR_ADMIN_PASSWORD" -X POST \
  "$SONAR_URL/api/user_tokens/generate" -d "name=$TOKEN_NAME" || true)"
if ! echo "$resp" | grep -q '"token"'; then
  resp="$(curl -s -u admin:admin -X POST \
    "$SONAR_URL/api/user_tokens/generate" -d "name=$TOKEN_NAME")"
fi
SONAR_TOKEN="$(echo "$resp" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')"
if [ -z "$SONAR_TOKEN" ]; then
  echo "ERRO: não foi possível gerar o token. Resposta: $resp" >&2
  exit 1
fi
export SONAR_TOKEN
echo "    Token gerado."

echo "==> Gerando cobertura (lcov)..."
npm run coverage:sonar

echo "==> Rodando o scanner..."
npm run sonar

echo "==> Concluído. Veja o resultado em $SONAR_URL (projeto: oficina-backend)."
