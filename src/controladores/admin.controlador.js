import * as adminServico from '../servicos/admin.servico.js';
import * as usuarioServico from '../servicos/usuario.servico.js';

export async function resumo(req, res) {
  res.json(await adminServico.obterResumo());
}

/** Gera o CRUD do administrador para um papel (cliente ou corretor), sem duplicar código. */
export function criarControladorDeUsuarios(papel) {
  return {
    async listar(req, res) {
      res.json(await usuarioServico.listarParaAdmin(papel, req.validado.consulta));
    },
    async obter(req, res) {
      res.json(await usuarioServico.obterParaAdmin(papel, req.validado.parametros.id));
    },
    async criar(req, res) {
      res.status(201).json(await usuarioServico.criarPeloAdmin(papel, req.validado.corpo));
    },
    async atualizar(req, res) {
      res.json(await usuarioServico.atualizarPeloAdmin(papel, req.validado.parametros.id, req.validado.corpo));
    },
    async excluir(req, res) {
      await usuarioServico.excluirPeloAdmin(papel, req.validado.parametros.id);
      res.status(204).end();
    }
  };
}
