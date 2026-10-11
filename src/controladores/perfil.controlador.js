import * as perfilServico from '../servicos/perfil.servico.js';

export async function obter(req, res) {
  res.json(await perfilServico.obter(req.usuario));
}

export async function atualizar(req, res) {
  res.json(await perfilServico.atualizar(req.usuario, req.validado.corpo));
}
