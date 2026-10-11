import { z } from 'zod';
import { LIMITES, STATUS_IMOVEL, TIPOS_IMOVEL } from '../config/constantes.js';
import { decodificarImagemDataUrl, MAX_CARACTERES_DATA_URL } from '../utilitarios/imagem.js';
import { idEsquema, inteiroDeConsulta, numeroDeConsulta, paginacaoEsquema, textoDeConsulta, textoLimpo, uuidEsquema, vazioComoAusente } from './comuns.js';

const ER_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Cada item de `fotos` é:
 *  - uma data URL de imagem NOVA (decodificada e validada aqui), ou
 *  - a URL/id de uma foto que o imóvel JÁ tem (como a API devolveu): mantida, na ordem informada.
 */
const fotoImovelEsquema = z
  .string()
  .max(MAX_CARACTERES_DATA_URL)
  .transform((valor, ctx) => {
    if (valor.startsWith('data:')) {
      const resultado = decodificarImagemDataUrl(valor);
      if (resultado.erro) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: resultado.erro });
        return z.NEVER;
      }
      return { nova: true, ...resultado };
    }

    const candidato = valor.length <= 300 ? valor.split('?')[0].split('/').pop() : '';
    if (!ER_UUID.test(candidato)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Foto inválida: envie uma imagem (data URL) ou a URL de uma foto já cadastrada neste imóvel.'
      });
      return z.NEVER;
    }
    return { nova: false, id: candidato.toLowerCase() };
  });

const caracteristicasEsquema = z
  .array(textoLimpo(1, LIMITES.maxCaracteresCaracteristica))
  .max(LIMITES.maxCaracteristicas)
  .transform((lista) => {
    // remove repetidas ignorando maiúsculas/minúsculas, preservando a primeira grafia
    const vistas = new Set();
    return lista.filter((item) => {
      const chave = item.toLowerCase();
      if (vistas.has(chave)) return false;
      vistas.add(chave);
      return true;
    });
  });

const camposImovel = {
  tipo: z.enum(TIPOS_IMOVEL),
  bairro: textoLimpo(2, 80, 'Informe o bairro.'),
  preco: z.number().int('O preço deve ser um número inteiro (em reais).').positive().max(1_000_000_000),
  areaM2: z.number().positive().max(10_000_000).transform((valor) => Math.round(valor * 100) / 100),
  quartos: z.number().int().min(0).max(50),
  vagas: z.number().int().min(0).max(50),
  status: z.enum([STATUS_IMOVEL.ATIVO, STATUS_IMOVEL.INATIVO]).optional(),
  caracteristicas: caracteristicasEsquema.default([]),
  fotos: z
    .array(fotoImovelEsquema)
    .min(0, 'Adicione ao menos 1 foto do imóvel.')
    .max(LIMITES.maxFotosPorImovel, `No máximo ${LIMITES.maxFotosPorImovel} fotos por imóvel.`)
    .superRefine((fotos, ctx) => {
      const ids = fotos.filter((foto) => !foto.nova).map((foto) => foto.id);
      if (new Set(ids).size !== ids.length) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'A mesma foto foi informada mais de uma vez.' });
      }
    })
};

export const esquemaImovel = z.object(camposImovel).strict();

export const esquemaStatusImovel = z
  .object({ status: z.enum([STATUS_IMOVEL.ATIVO, STATUS_IMOVEL.INATIVO]) })
  .strict();

export const parametrosImovelEsquema = z.object({ id: idEsquema }).strict();
export const parametrosFotoEsquema = z.object({ id: uuidEsquema }).strict();

// Critérios de busca do cliente (mesmos filtros da tela de busca). Vazio = filtro não informado.
const criteriosBusca = {
  busca: textoDeConsulta(100),
  tipo: vazioComoAusente(z.enum(TIPOS_IMOVEL).optional()),
  bairro: textoDeConsulta(80),
  precoMin: numeroDeConsulta(0, 1_000_000_000),
  precoMax: numeroDeConsulta(0, 1_000_000_000),
  quartos: inteiroDeConsulta(0, 50),
  vagas: inteiroDeConsulta(0, 50)
};

const precoMinimoNaoExcedeMaximo = (consulta) =>
  consulta.precoMin == null || consulta.precoMax == null || consulta.precoMin <= consulta.precoMax;

export const consultaBuscaImoveisEsquema = z
  .object({ ...criteriosBusca, ...paginacaoEsquema(12, 50) })
  .strict()
  .refine(precoMinimoNaoExcedeMaximo, { message: 'O preço mínimo não pode ser maior que o máximo.', path: ['precoMin'] });

// No detalhe, os critérios são opcionais e servem só para calcular o % de compatibilidade.
export const consultaDetalheImovelEsquema = z
  .object(criteriosBusca)
  .strict()
  .refine(precoMinimoNaoExcedeMaximo, { message: 'O preço mínimo não pode ser maior que o máximo.', path: ['precoMin'] });
