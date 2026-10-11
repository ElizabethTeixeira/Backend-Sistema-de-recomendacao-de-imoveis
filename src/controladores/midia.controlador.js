import * as midiaServico from '../servicos/midia.servico.js';

const UM_ANO = 'public, max-age=31536000, immutable';
const UM_DIA = 'public, max-age=86400';

/**
 * Entrega a imagem como arquivo. Cabeçalhos defensivos:
 *  - CORP cross-origin: o <img> do front fica em outra origem (o helmet bloqueia isso por padrão)
 *  - CSP restritiva + nosniff (via helmet): a resposta nunca é interpretada como página/script
 */
function enviarImagem(res, { tipoMime, dados }, cache) {
  const corpo = Buffer.from(dados.buffer, dados.byteOffset, dados.byteLength);
  res.set({
    'Content-Type': tipoMime,
    'Content-Length': String(corpo.length),
    'Content-Disposition': 'inline',
    'Content-Security-Policy': "default-src 'none'; sandbox",
    'Cross-Origin-Resource-Policy': 'cross-origin',
    'Cache-Control': cache
  });
  res.send(corpo);
}

// A URL da foto de imóvel é um UUID que nunca é reaproveitado: pode ser cacheada para sempre.
export async function fotoDoImovel(req, res) {
  enviarImagem(res, await midiaServico.obterFotoDoImovel(req.validado.parametros.id), UM_ANO);
}

// A URL da foto do corretor carrega ?v=<versão>; sem ela o cache é curto.
export async function fotoDoCorretor(req, res) {
  enviarImagem(res, await midiaServico.obterFotoDoCorretor(req.validado.parametros.id), UM_DIA);
}
