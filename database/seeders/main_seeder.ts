import { randomUUID } from 'node:crypto'
import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { servicoDeHash } from '#shared/frameworks-drivers/hash/servico-de-hash-adonis'
import UsuarioModel from '#modulos/autenticacao/frameworks-drivers/models/usuario_model'
import ServicoModel from '#modulos/servicos/frameworks-drivers/models/servico_model'
import PecaModel from '#modulos/estoque/frameworks-drivers/models/peca_model'

export default class extends BaseSeeder {
  async run() {
    // Administrador inicial (credenciais para acesso às APIs administrativas).
    await UsuarioModel.updateOrCreate(
      { email: 'admin@oficina.com' },
      {
        id: randomUUID(),
        nome: 'Administrador',
        email: 'admin@oficina.com',
        senhaHash: await servicoDeHash.gerar('admin12345'),
      }
    )

    // Catálogo de serviços de exemplo.
    const servicos = [
      { nome: 'Troca de óleo', descricao: 'Troca de óleo do motor', precoCentavos: 12000 },
      { nome: 'Alinhamento', descricao: 'Alinhamento e balanceamento', precoCentavos: 9000 },
      { nome: 'Revisão completa', descricao: 'Revisão geral do veículo', precoCentavos: 35000 },
    ]
    for (const servico of servicos) {
      await ServicoModel.updateOrCreate({ nome: servico.nome }, { id: randomUUID(), ...servico })
    }

    // Peças/insumos de exemplo com estoque inicial.
    const pecas = [
      { nome: 'Óleo 5W30 (litro)', precoCentavos: 4500, quantidadeEstoque: 50 },
      { nome: 'Filtro de óleo', precoCentavos: 3000, quantidadeEstoque: 30 },
      { nome: 'Pastilha de freio', precoCentavos: 8000, quantidadeEstoque: 20 },
    ]
    for (const peca of pecas) {
      await PecaModel.updateOrCreate(
        { nome: peca.nome },
        { id: randomUUID(), descricao: null, ...peca }
      )
    }
  }
}
