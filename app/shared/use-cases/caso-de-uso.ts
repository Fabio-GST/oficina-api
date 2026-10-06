/**
 * Contrato de um Caso de Uso da camada de aplicação.
 *
 * Cada caso de uso orquestra entidades de domínio e repositórios para realizar
 * uma única intenção do negócio. `Entrada`/`Saida` são DTOs simples.
 */
export interface CasoDeUso<Entrada, Saida> {
  executar(entrada: Entrada): Promise<Saida>
}
