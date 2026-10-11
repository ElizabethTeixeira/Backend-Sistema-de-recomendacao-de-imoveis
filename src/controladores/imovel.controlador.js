import * as imovelServico from '../servicos/imovel.servico.js';

export async function buscar(req, res) {
  res.json(await imovelServico.buscar(req.validado.consulta));
}

export async function listarMeus(req, res) {
  res.json(await imovelServico.listarDoCorretor(req.usuario.id));
}

export async function obterDetalhe(req, res) {
  res.json(await imovelServico.obterDetalhe(req.usuario, req.validado.parametros.id, req.validado.consulta));
}

export async function criar(req, res) {
  res.status(201).json(await imovelServico.criar(req.usuario, req.validado.corpo));
}

export async function atualizar(req, res) {
  res.json(await imovelServico.atualizar(req.usuario, req.validado.parametros.id, req.validado.corpo));
}

export async function alterarStatus(req, res) {
  res.json(await imovelServico.alterarStatus(req.usuario, req.validado.parametros.id, req.validado.corpo.status));
}

export async function excluir(req, res) {
  await imovelServico.excluir(req.usuario, req.validado.parametros.id);
  res.status(204).end();
}
