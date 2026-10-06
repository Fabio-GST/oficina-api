/*
|--------------------------------------------------------------------------
| Registro de Manipuladores de Eventos de Domínio (Políticas)
|--------------------------------------------------------------------------
|
| Composition root das Políticas (POL): cada manipulador reage a um Evento de
| Domínio de um contexto e dispara um comando em outro — sem acoplamento
| síncrono entre os módulos. Os agregados registram eventos durante os casos de
| uso; a publicação acontece após o commit (ver `coletor-de-eventos.ts`).
| Os casos de uso são resolvidos pelo container IoC (este preload roda após o
| registro dos providers).
|
| Mapa evento → política:
|   ordem-servico.aprovada       → utilizar peças reservadas + avisar cliente
|   ordem-servico.recusada       → liberar reservas de peças
|   ordem-servico.finalizada     → gerar cobrança + avisar cliente
|   ordem-servico.veiculo-entregue → avisar cliente
|   pagamento.confirmado         → emitir Nota Fiscal (assíncrono)
|   estoque.abaixo-do-minimo     → alertar almoxarife + solicitar compra
|
*/

import app from '@adonisjs/core/services/app'
import { barramentoDeEventos } from '#shared/frameworks-drivers/eventos/barramento-de-eventos'
import { servicoDeNotificacao } from '#shared/frameworks-drivers/notificacao/fabrica'
import { DetalharOrdem } from '#modulos/ordens-servico/use-cases/consultas'
import { ObterCliente } from '#modulos/clientes/use-cases/obter-cliente'
import { UtilizarPeca } from '#modulos/estoque/use-cases/utilizar-peca'
import { LiberarReservaDePeca } from '#modulos/estoque/use-cases/liberar-reserva-de-peca'
import { SolicitarCompra } from '#modulos/estoque/use-cases/solicitar-compra'
import { GerarCobranca } from '#modulos/pagamento/use-cases/gerar-cobranca'
import { EmitirNotaFiscal } from '#modulos/pagamento/use-cases/emitir-nota-fiscal'
import { UtilizarPecasAoAprovar } from '#politicas/utilizar-pecas-ao-aprovar'
import { LiberarReservaAoRecusar } from '#politicas/liberar-reserva-ao-recusar'
import { GerarCobrancaAoFinalizar } from '#politicas/gerar-cobranca-ao-finalizar'
import { EmitirNotaAoConfirmarPagamento } from '#politicas/emitir-nota-ao-confirmar-pagamento'
import { SolicitarCompraAoAtingirMinimo } from '#politicas/solicitar-compra-ao-atingir-minimo'
import { NotificarClienteSobreOS } from '#politicas/notificar-cliente-sobre-os'

/** Resolve o caso de uso no container e executa-o com a entrada dada. */
async function executar<E extends unknown[], S>(
  token: new (...args: never[]) => { executar(...entrada: E): Promise<S> },
  ...entrada: E
): Promise<S> {
  const casoDeUso: { executar(...entrada: E): Promise<S> } = await app.container.make(token)
  return casoDeUso.executar(...entrada)
}

const detalharOrdem = (id: string) => executar(DetalharOrdem, id)

/** Resolve o destinatário das notificações (cliente da OS), tolerante a falhas. */
const destinatarioDaOrdem = async (ordemId: string) => {
  try {
    const ordem = await detalharOrdem(ordemId)
    const cliente = await executar(ObterCliente, ordem.clienteId)
    return { nome: cliente.nome, email: cliente.email }
  } catch {
    return null
  }
}

// OS aprovada → consome as peças reservadas
barramentoDeEventos.registrar(
  new UtilizarPecasAoAprovar(detalharOrdem, (e) => executar(UtilizarPeca, e))
)

// OS recusada → libera as reservas
barramentoDeEventos.registrar(
  new LiberarReservaAoRecusar(detalharOrdem, (e) => executar(LiberarReservaDePeca, e))
)

// OS finalizada → gera cobrança + avisa o cliente
barramentoDeEventos.registrar(
  new GerarCobrancaAoFinalizar(
    detalharOrdem,
    (e) => executar(GerarCobranca, e),
    servicoDeNotificacao,
    destinatarioDaOrdem
  )
)

// Pagamento integral confirmado → emite Nota Fiscal (assíncrono)
barramentoDeEventos.registrar(
  new EmitirNotaAoConfirmarPagamento((id) => executar(EmitirNotaFiscal, id))
)

// Estoque abaixo do mínimo → alerta almoxarife + solicita compra
barramentoDeEventos.registrar(
  new SolicitarCompraAoAtingirMinimo((e) => executar(SolicitarCompra, e), servicoDeNotificacao)
)

// Avisos ao cliente a cada atualização de status da OS (requisito Fase 2:
// atualização de status via e-mail — canal definido por NOTIFICACAO_DRIVER).
const AVISOS_DE_STATUS: [string, string][] = [
  ['ordem-servico.aberta', 'Recebemos seu veículo e sua Ordem de Serviço foi aberta.'],
  ['ordem-servico.diagnostico-iniciado', 'O diagnóstico do seu veículo foi iniciado.'],
  ['ordem-servico.orcamento-gerado', 'Seu orçamento está pronto e aguarda sua aprovação.'],
  ['ordem-servico.aprovada', 'Seu orçamento foi aprovado e o serviço será iniciado.'],
  ['ordem-servico.recusada', 'Registramos a recusa do orçamento. A OS foi encerrada.'],
  ['ordem-servico.veiculo-entregue', 'Seu veículo foi entregue. Obrigado pela preferência!'],
]
for (const [evento, mensagem] of AVISOS_DE_STATUS) {
  barramentoDeEventos.registrar(
    new NotificarClienteSobreOS(evento, mensagem, servicoDeNotificacao, destinatarioDaOrdem)
  )
}
