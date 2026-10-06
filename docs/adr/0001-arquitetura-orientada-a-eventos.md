# ADR 0001 — Arquitetura Orientada a Eventos entre os Domínios

- **Status:** Aceito
- **Data:** 2026-06-27
- **Contexto técnico:** AdonisJS v6 + TypeScript, DDD modular por bounded contexts.

## Contexto

A documentação do domínio (Domain Storytelling + diagramas no Miro) descreve cada agregado como
uma sequência **Comando → Evento → Política (CMD/EV/POL)** e pede **arquitetura orientada a
eventos**, com desacoplamento entre os contextos e **sem chamadas síncronas** entre eles
(ex.: Pagamento ↔ Nota Fiscal).

No estado anterior, o DDD tático já era sólido, mas:

- os Eventos de Domínio eram acumulados nos agregados (`RaizAgregado.extrairEventos`) e **nunca
  publicados** — não havia barramento nem manipuladores;
- a integração entre contextos era **síncrona e acoplada** (ex.: a Ordem de Serviço dava baixa
  direta no Estoque dentro do mesmo caso de uso).

## Decisão

Adotar um **barramento de eventos in-process** com **publicação após o commit**:

1. Os agregados registram Eventos de Domínio (`registrarEvento`) durante os casos de uso.
2. Após `repositorio.salvar(...)`, o caso de uso chama `coletarEventosDe(agregado)`.
3. Dentro de uma Unidade de Trabalho, os eventos são **bufferizados e publicados somente após o
   commit** (`publicarAposCommit` + `AsyncLocalStorage`); fora dela, publicados imediatamente.
4. As **Políticas** (`app/politicas`) são manipuladores que reagem a um evento de um contexto e
   disparam um comando em outro, registrados no boot em `start/eventos.ts`.
5. Falhas de uma Política são **isoladas** (log) e não derrubam o fluxo de origem, que já foi
   persistido.

Contratos relevantes: `DespachanteDeEventos`, `ManipuladorDeEvento`; implementação
`BarramentoDeEventos` (singleton `barramentoDeEventos`).

## Consequências

**Positivas**

- Remove o acoplamento síncrono entre contextos (ex.: a baixa de estoque da OS virou
  **reserva** na composição + **utilização** acionada por Política na aprovação).
- A emissão de Nota Fiscal passa a ser **assíncrona** (reação a `pagamento.confirmado`),
  conforme exigido.
- Novos comportamentos entre contextos são adicionados como novas Políticas, sem alterar os
  agregados.

**Negativas / limitações**

- **In-process**: sem entrega garantida nem retentativas; se o processo cair após o commit e
  antes de processar um evento, a reação é perdida.
- A publicação pós-commit é **eventual** dentro do processo (não há atomicidade entre o commit e
  o efeito da Política).

## Evolução futura

A interface `DespachanteDeEventos` permite trocar o barramento in-process por um **Outbox +
fila/broker** (entrega garantida, retentativas, idempotência) **sem alterar domínio nem
aplicação** — apenas a implementação de infraestrutura e o registro das Políticas.

## Alternativas consideradas

- **Chamadas síncronas diretas entre módulos** (estado anterior): rejeitada por acoplar os
  contextos e violar a diretriz de assincronia.
- **Outbox + broker desde já**: adia valor e adiciona operação (broker) desnecessária ao MVP;
  fica como caminho de evolução.
</content>
