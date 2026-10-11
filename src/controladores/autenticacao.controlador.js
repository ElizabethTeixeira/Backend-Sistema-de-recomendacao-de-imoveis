import { PAPEIS } from '../config/constantes.js';
import * as autenticacaoServico from '../servicos/autenticacao.servico.js';

export async function cadastrarCliente(req, res) {
  res.status(201).json(await autenticacaoServico.cadastrar(PAPEIS.CLIENTE, req.validado.corpo));
}

export async function cadastrarCorretor(req, res) {
  res.status(201).json(await autenticacaoServico.cadastrar(PAPEIS.CORRETOR, req.validado.corpo));
}

export async function entrar(req, res) {
  res.json(await autenticacaoServico.entrar(req.validado.corpo));
}

export async function sair(req, res) {
  await autenticacaoServico.sair(req.usuario);
  res.status(204).end();
}
