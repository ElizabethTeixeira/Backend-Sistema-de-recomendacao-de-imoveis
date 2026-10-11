import { LIMITES, TIPOS_IMAGEM_PERMITIDOS } from '../config/constantes.js';

const PREFIXO_DATA_URL = /^data:(image\/[a-z0-9.+-]+);base64,/;
const BASE64_VALIDO = /^[A-Za-z0-9+/]+={0,2}$/;

/** Tamanho máximo, em caracteres, de uma data URL aceitável (evita processar strings gigantes). */
export const MAX_CARACTERES_DATA_URL = Math.ceil((LIMITES.maxBytesPorFoto * 4) / 3) + 64;

/** Detecta o tipo real pelos primeiros bytes (a declaração do cliente não é confiável). */
function detectarTipoPelosBytes(dados) {
  if (dados.length >= 3 && dados[0] === 0xff && dados[1] === 0xd8 && dados[2] === 0xff) return 'image/jpeg';
  if (
    dados.length >= 8 &&
    dados.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return 'image/png';
  }
  if (
    dados.length >= 12 &&
    dados.subarray(0, 4).toString('ascii') === 'RIFF' &&
    dados.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return 'image/webp';
  }
  return null;
}

/**
 * Converte uma data URL (formato que o front já gera com FileReader.readAsDataURL) em bytes validados.
 * Retorna { tipoMime, dados, tamanho } ou { erro } com a mensagem para o usuário.
 * SVG é recusado de propósito: pode carregar scripts.
 */
export function decodificarImagemDataUrl(dataUrl) {
  const prefixo = PREFIXO_DATA_URL.exec(dataUrl.slice(0, 40));
  if (!prefixo) return { erro: 'Imagem inválida. Envie uma data URL base64 (image/jpeg, image/png ou image/webp).' };

  const tipoDeclarado = prefixo[1];
  if (!TIPOS_IMAGEM_PERMITIDOS.includes(tipoDeclarado)) {
    return { erro: 'Formato de imagem não permitido. Use JPEG, PNG ou WebP.' };
  }

  const base64 = dataUrl.slice(prefixo[0].length);
  const tamanhoEstimado = Math.floor((base64.length * 3) / 4);
  if (tamanhoEstimado > LIMITES.maxBytesPorFoto) {
    const mb = (LIMITES.maxBytesPorFoto / (1024 * 1024)).toFixed(1).replace('.0', '');
    return { erro: `Cada imagem pode ter no máximo ${mb} MB.` };
  }
  if (!BASE64_VALIDO.test(base64) || base64.length % 4 !== 0) return { erro: 'Imagem corrompida (base64 inválido).' };

  const dados = Buffer.from(base64, 'base64');
  const tipoReal = detectarTipoPelosBytes(dados);
  if (!tipoReal || tipoReal !== tipoDeclarado) {
    return { erro: 'O conteúdo do arquivo não corresponde a uma imagem JPEG, PNG ou WebP válida.' };
  }

  return { tipoMime: tipoReal, dados, tamanho: dados.length };
}
