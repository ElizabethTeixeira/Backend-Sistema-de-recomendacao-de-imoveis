import * as conversaServico from '../servicos/conversa.servico.js';

export async function listar(req, res) {
  res.json(await conversaServico.listar(req.usuario, req.validado.consulta));
}

export async function contarNaoLidas(req, res) {
  res.json(await conversaServico.contarNaoLidas(req.usuario));
}

export async function marcarTodasComoLidas(req, res) {
  res.json(await conversaServico.marcarComoLidas(req.usuario));
}

export async function marcarComoLidas(req, res) {
  res.json(await conversaServico.marcarComoLidas(req.usuario, req.validado.parametros.id));
}

/** POST /imoveis/:id/mensagens: cliente escreve ao corretor do imóvel. */
export async function enviarSobreImovel(req, res) {
  const { parametros, corpo } = req.validado;
  res.status(201).json(await conversaServico.enviarMensagemSobreImovel(req.usuario, parametros.id, corpo.texto));
}

/** POST /conversas/:id/mensagens: resposta numa conversa existente (cliente ou corretor). */
export async function responder(req, res) {
  const { parametros, corpo } = req.validado;
  res.status(201).json(await conversaServico.responder(req.usuario, parametros.id, corpo.texto));
}
