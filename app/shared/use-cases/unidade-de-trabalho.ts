/**
 * Porta da Unidade de Trabalho (Unit of Work).
 *
 * Executa uma operação de forma atômica: tudo que for persistido dentro do
 * callback é confirmado (ou desfeito) de uma só vez. A camada de aplicação
 * conhece apenas este contrato; a implementação (transação de banco) vive na
 * infraestrutura e é injetada pelo composition root (fábricas).
 */
export interface UnidadeDeTrabalho {
  executar<T>(operacao: () => Promise<T>): Promise<T>
}
