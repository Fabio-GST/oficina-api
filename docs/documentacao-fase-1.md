# Documento de Entrega — Tech Challenge Fase 1

**Pós Tech — Arquitetura de Software (SOAT)**
São Paulo, 29 de junho de 2026

---

## 1. Identificação

- **Estudante:** Fabio Gustavo da Silva Teixeira
- **Username Discord:** fabiogustavo
- **Link da Apresentação:** Google Drive
- **Link do Repositório:** [GitHub](https://github.com/Fabio-GST/Tech-Challenge)
- **Link do Miro:** Miro

## 2. Visão Geral do Projeto

### 2.1 Objetivo do Projeto

Este projeto apresenta o MVP de um sistema de gestão para oficinas mecânicas, fundamentado nos
princípios de **Domain-Driven Design (DDD)** e **arquitetura limpa**. A solução foi desenhada
para mitigar gargalos operacionais críticos, como a desorganização de ordens de serviço, a
ausência de histórico veicular e a ineficiência na gestão de estoques, proporcionando um fluxo
de trabalho altamente rastreável e automatizado.

### 2.2 Justificativa da Escolha do Banco de Dados (MySQL)

A escolha do MySQL justifica-se pela sua maturidade e robustez no suporte a transações **ACID**,
essenciais para a integridade dos dados em domínios transacionais onde a consistência é
inegociável — especificamente nos módulos de gestão financeira (Pagamentos) e controle de
estoque (Reservas). A natureza relacional do banco de dados permitiu uma modelagem precisa dos
agregados, assegurando relacionamentos granulares entre Cliente, Veículo e Ordem de Serviço,
além de oferecer um excelente desempenho para consultas complexas que sustentam os Modelos de
Leitura (Read Models) demandados pela arquitetura.

### 2.3 Linguagem Ubíqua

Para garantir a unificação entre a lógica de negócio e a implementação técnica, adotamos o
seguinte glossário compartilhado:

| Termo | Definição |
| --- | --- |
| **Ordem de Serviço (O.S.)** | O agregado central que encapsula todo o ciclo de reparação, desde o diagnóstico até o fechamento financeiro. |
| **Diagnóstico** | Avaliação técnica inicial que justifica a necessidade de Peças e Serviços. |
| **Orçamento** | Proposta financeira baseada na O.S. A política de negócio impede a execução de serviços sem a transição para o estado "Aprovado". |
| **TMO (Tempo Médio de Oficina)** | Métrica padrão utilizada para calcular o custo da mão de obra, garantindo uniformidade na precificação. |
| **Reserva de Estoque** | Política de domínio que garante que, ao adicionar uma Peça à O.S., o item seja subtraído do inventário disponível, evitando vendas duplicadas. |
| **Status de O.S.** | Máquina de estados que regula o fluxo de trabalho (ex.: Aguardando Aprovação vs. Em Execução). |
| **Modelo de Leitura** | Projeção de dados simplificada (ex.: Kanban de Oficina) utilizada para guiar a tomada de decisão do usuário final sem expor a complexidade do agregado. |

## 3. Arquitetura e Fluxos (DDD)

### 3.1 Gestão de Clientes

O módulo de Gestão de Clientes é o pilar fundamental para a identidade de todos os usuários no
sistema. O fluxo operacional inicia-se com a identificação por CPF ou CNPJ. Caso o cliente ainda
não possua um registro, o sistema automaticamente dispara o fluxo de cadastro, onde políticas
rígidas de validação de dados sensíveis são aplicadas antes de qualquer persistência no banco de
dados. Para apoiar a tomada de decisão do atendente, disponibilizamos modelos de leitura que
incluem desde uma funcionalidade de busca e listagem eficiente até a exibição de uma ficha
resumo, que consolida as informações essenciais para um atendimento personalizado.

> Figura 1: Fluxo de Gestão de Clientes.

### 3.2 Gestão de Veículos

A Gestão de Veículos é responsável pelo registro e pela rastreabilidade dos ativos que dão
entrada na oficina. O processo é otimizado através da busca por placa, que permite ao sistema
recuperar dados pré-existentes. Quando um veículo é novo para a oficina, o sistema exige o
cadastro e a validação de seus dados. Uma política mandatória impõe a vinculação direta deste
veículo ao seu cliente proprietário, garantindo a integridade do relacionamento. Como modelos de
leitura, o sistema oferece uma ficha detalhada do veículo e um histórico completo de manutenções
vinculadas ao cliente, permitindo uma visão holística do ativo.

> Figura 2: Fluxo de Gestão de Veículos.

### 3.3 Operação de Oficina

O fluxo de O.S. gerencia todo o ciclo de vida da reparação, desde o diagnóstico inicial até a
entrega final do veículo. O processo contempla a abertura da ordem, a realização do diagnóstico
técnico, a adição precisa de serviços e peças, e a etapa crítica de aprovação do orçamento pelo
cliente. Implementamos políticas de negócio que bloqueiam a execução de qualquer reparo caso o
orçamento não tenha sido formalmente aprovado, protegendo a oficina contra riscos financeiros e
garantindo a transparência na comunicação com o cliente.

> Figura 3: Ciclo de vida completo da O.S.

### 3.4 Gestão de Peças

O agregado de Peças foca na integridade do inventário e na disponibilidade de insumos. O fluxo
operacional integra a reserva automática de saldo no momento em que um item é adicionado a uma
O.S., garantindo que a peça esteja disponível para a execução.

> Figura 4: Gestão de estoque e peças.

### 3.5 Gestão de Serviços

O agregado de Serviços compõe o catálogo mestre de mão de obra da oficina, garantindo a
padronização e precificação justa. Cada serviço é precificado com base no Tempo Médio de Oficina
(TMO), que estabelece a estimativa de tempo e custo.

- **Fluxo:** Cadastro de serviço → Definição de TMO → Precificação.
- **Políticas:** Serviços inativados não podem ser adicionados a novas O.S., preservando a
  integridade das tabelas de preço vigentes.
- **Modelos de Leitura:** Tabela de Preços, Matriz de TMO.

> Figura 5: Gestão de Serviços (catálogo de mão de obra).

### 3.6 Financeiro

O fluxo financeiro atua no fechamento da conta, integrando as etapas de registro de pagamento
com os processos fiscais. O sistema permite a aplicação de descontos e o registro de múltiplas
formas de pagamento. Como política de conformidade, o registro de um pagamento integral dispara
automaticamente a emissão da Nota Fiscal correspondente, eliminando intervenções manuais,
reduzindo erros operacionais e garantindo que a oficina esteja sempre em conformidade com as
exigências fiscais.

> Figura 6: Fluxo de Pagamentos.

## 4. Relatório de Análise de Qualidade e Vulnerabilidades (SonarQube)

### 4.1 Resumo Executivo

Este relatório apresenta os resultados da análise estática de código realizada pela ferramenta
SonarQube no repositório do projeto Tech Challenge. O objetivo desta validação é garantir a
aderência às boas práticas de Arquitetura de Software, com foco em segurança (vulnerabilidades),
confiabilidade (bugs) e manutenibilidade (code smells) para o MVP do sistema de gestão para
oficinas mecânicas.

- **Data da Análise:** 29 de junho de 2026
- **Quality Gate:** Passed (Aprovado)
- **Versão do Projeto:** MVP (Fase 1)

### 4.2 Visão Geral das Métricas

A varredura identificou o seguinte panorama de excelência no código atual:

| Métrica | Resultado |
| --- | --- |
| Vulnerabilidades (Security) | 0 (Rating: A) |
| Security Hotspots | 0 (Review: —) |
| Bugs (Reliability) | 0 (Rating: A) |
| Code Smells (Maintainability) | 0 (Rating: A) |
| Débito Técnico Estimado (Debt) | 0h |
| Cobertura de Testes (Coverage) | 99,7% (em 5,8k linhas) |
| Duplicações de Código | 0,0% (0 blocos duplicados em 4,3k linhas) |

### 4.3 Análise de Segurança e Vulnerabilidades

A análise atual **não identificou vulnerabilidades de segurança** (Security Rating A). O código
está em conformidade com as melhores práticas de mercado, não apresentando brechas conhecidas,
como injeção de dependências, exposição de dados sensíveis ou falhas de autenticação.
Adicionalmente, não foram detectados Security Hotspots que exigissem revisão manual.

### 4.4 Manutenibilidade e Code Smells

O projeto atingiu a nota máxima em manutenibilidade (Rating A), com 0 code smells e 0 horas de
débito técnico. Isso indica uma base de código extremamente limpa, legível e bem estruturada,
alinhada aos princípios de Clean Code e arquitetura limpa propostos no escopo do projeto. A
ausência de duplicação de código (0,0%) reforça o reaproveitamento eficiente dos componentes.

### 4.5 Confiabilidade e Cobertura de Testes

- **Bugs:** Não foram encontrados bugs (Rating A), evidenciando a alta confiabilidade das regras
  de negócio implementadas nos fluxos de domínio (DDD).
- **Testes:** A cobertura atual de 99,7% é excepcional e supera com folga os requisitos de
  mercado para esteiras de CI/CD. Os cenários de testes estão cobrindo praticamente a totalidade
  das regras de negócio críticas do sistema, como as lógicas financeiras e de reservas de
  estoque.

### 4.6 Conclusão e Plano de Ação

O projeto apresenta um nível excelente em relação às métricas de qualidade e segurança
estabelecidas. O Quality Gate foi aprovado sem ressalvas, demonstrando maturidade técnica na
implementação da solução.

**Próximos passos recomendados para evolução contínua:**

1. Manter a esteira de CI/CD configurada para bloquear Pull Requests que reduzam o Security
   Rating ou Maintainability Rating abaixo de "A".
2. Preservar o limite mínimo de cobertura de testes em patamares altos (ex.: acima de 90%) para
   os próximos ciclos de desenvolvimento e evolução do MVP.
