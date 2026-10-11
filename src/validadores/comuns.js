import { z } from 'zod';
import './mapaErros.js';
import { LIMITES } from '../config/constantes.js';
import { apenasDigitos, cpfValido, telefoneValido } from '../utilitarios/documentos.js';
import { decodificarImagemDataUrl, MAX_CARACTERES_DATA_URL } from '../utilitarios/imagem.js';
import { limparEspacos } from '../utilitarios/texto.js';

// Postgres recusa o caractere NUL em texto (viraria erro 500): barramos na entrada.
const semCaractereNulo = (valor) => !valor.includes('\u0000');

/** Texto curto: espaços colapsados, sem NUL, entre `minimo` e `maximo` caracteres. */
export const textoLimpo = (minimo, maximo, mensagemMinimo) =>
  z
    .string()
    .transform(limparEspacos)
    .pipe(
      z
        .string()
        .min(minimo, mensagemMinimo)
        .max(maximo)
        .refine(semCaractereNulo, 'Texto contém caracteres inválidos.')
    );

export const nomeEsquema = textoLimpo(2, 120, 'Informe o nome completo.');

export const emailEsquema = z.string().trim().toLowerCase().max(254).email('E-mail inválido.');

export const telefoneEsquema = z
  .string()
  .max(20)
  .refine(telefoneValido, 'Telefone inválido. Use DDD + número.')
  .transform(apenasDigitos);

export const cpfEsquema = z.string().max(20).refine(cpfValido, 'CPF inválido.').transform(apenasDigitos);

export const creciEsquema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^\d{4,6}-[A-Z]{2}$/, 'CRECI inválido. Use o formato 000000-UF.');

export const dataNascimentoEsquema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use o formato AAAA-MM-DD.')
  .transform((valor, ctx) => {
    const data = new Date(`${valor}T00:00:00.000Z`);
    if (Number.isNaN(data.getTime()) || data.toISOString().slice(0, 10) !== valor) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Data inválida.' });
      return z.NEVER;
    }
    if (data > new Date() || data.getUTCFullYear() < 1900) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Data de nascimento fora do intervalo permitido.' });
      return z.NEVER;
    }
    return data;
  });

/** Senha NOVA (cadastro, troca, redefinição pelo admin). No login não se aplica a regra de tamanho mínimo. */
export const senhaNovaEsquema = z
  .string()
  .min(LIMITES.senhaMinima, `A senha deve ter ao menos ${LIMITES.senhaMinima} caracteres.`)
  .refine(
    (valor) => Buffer.byteLength(valor) <= LIMITES.senhaMaximaBytes,
    `A senha deve ter no máximo ${LIMITES.senhaMaximaBytes} bytes.`
  );

export const senhaAtualEsquema = z.string().min(1, 'Informe a senha atual.').max(128);

/**
 * Foto de perfil (corretor). Resultado da validação:
 *  - undefined → campo omitido: mantém a foto atual
 *  - null      → remove a foto
 *  - { manter: true } → o front devolveu a URL que a API enviou: mantém
 *  - { tipoMime, dados, tamanho } → data URL nova, já decodificada e validada
 */
export const fotoPerfilEsquema = z
  .string()
  .max(MAX_CARACTERES_DATA_URL)
  .transform((valor, ctx) => {
    if (!valor.startsWith('data:')) {
      if (valor.length <= 300) return { manter: true };
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Foto inválida.' });
      return z.NEVER;
    }
    const resultado = decodificarImagemDataUrl(valor);
    if (resultado.erro) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: resultado.erro });
      return z.NEVER;
    }
    return resultado;
  })
  .nullable()
  .optional();

// ---- Parâmetros de rota e de consulta (query string) ----

export const idEsquema = z
  .string()
  .regex(/^\d{1,10}$/, 'Identificador inválido.')
  .transform(Number)
  .pipe(z.number().int().positive().max(2_147_483_647, 'Identificador inválido.'));

export const uuidEsquema = z.string().uuid('Identificador inválido.');

/** Query string vazia (?campo=) equivale a campo ausente: é como o front envia filtros em branco. */
export const vazioComoAusente = (esquema) => z.preprocess((valor) => (valor === '' ? undefined : valor), esquema);

export const inteiroDeConsulta = (minimo, maximo) =>
  vazioComoAusente(z.coerce.number().int().min(minimo).max(maximo).optional());

export const numeroDeConsulta = (minimo, maximo) =>
  vazioComoAusente(z.coerce.number().min(minimo).max(maximo).optional());

export const textoDeConsulta = (maximo) =>
  vazioComoAusente(
    z
      .string()
      .trim()
      .max(maximo)
      .refine(semCaractereNulo, 'Texto contém caracteres inválidos.')
      .optional()
  );

export const paginacaoEsquema = (limitePadrao, limiteMaximo) => ({
  pagina: vazioComoAusente(z.coerce.number().int().min(1).max(100_000).default(1)),
  limite: vazioComoAusente(z.coerce.number().int().min(1).max(limiteMaximo).default(limitePadrao))
});

export const semNulo = semCaractereNulo;
