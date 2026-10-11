import dotenv from 'dotenv';
import { hkdfSync } from 'node:crypto';
import { z } from 'zod';

dotenv.config({ quiet: true });

/**
 * Apenas DATABASE_URL, ADMIN_EMAIL e ADMIN_PASSWORD são obrigatórias.
 * As demais são opcionais e têm padrões seguros (ver .env.example).
 */
const esquemaAmbiente = z.object({
  DATABASE_URL: z
    .string({ required_error: 'DATABASE_URL é obrigatória (URL do Neon).' })
    .trim()
    .regex(/^postgres(ql)?:\/\//, 'DATABASE_URL deve começar com postgresql://'),
  ADMIN_EMAIL: z
    .string({ required_error: 'ADMIN_EMAIL é obrigatório.' })
    .trim()
    .toLowerCase()
    .email('ADMIN_EMAIL não é um e-mail válido.')
    .max(254),
  ADMIN_PASSWORD: z
    .string({ required_error: 'ADMIN_PASSWORD é obrigatória.' })
    .min(10, 'ADMIN_PASSWORD deve ter ao menos 10 caracteres.')
    .refine((valor) => Buffer.byteLength(valor) <= 72, 'ADMIN_PASSWORD deve ter no máximo 72 bytes.'),

  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3333),
  // Origens do front permitidas no CORS, separadas por vírgula. Ex.: https://meusite.com,http://localhost:5500
  CORS_ORIGINS: z.string().default(''),
  // Quantos proxies existem na frente do servidor (Render/Railway/Cloudflare = 1). 0 = nenhum.
  TRUST_PROXY: z.coerce.number().int().min(0).max(5).default(0),
  // Opcional. Sem ele, o segredo do JWT é derivado de DATABASE_URL + credenciais do admin.
  JWT_SECRET: z.string().min(32, 'JWT_SECRET deve ter ao menos 32 caracteres.').optional(),
  JWT_EXPIRES_IN: z.string().regex(/^\d+[smhd]$/, 'Use o formato 8h, 30m, 7d...').default('8h'),
  DOCS_ENABLED: z
    .enum(['true', 'false'])
    .default('true')
    .transform((valor) => valor === 'true')
});

// Variável presente porém vazia (ex.: "JWT_SECRET=") vale como ausente.
const bruto = Object.fromEntries(Object.entries(process.env).filter(([, valor]) => valor !== ''));
const resultado = esquemaAmbiente.safeParse(bruto);

if (!resultado.success) {
  const problemas = resultado.error.issues.map((i) => `  - ${i.path.join('.') || 'env'}: ${i.message}`).join('\n');
  console.error(`\nConfiguração de ambiente inválida:\n${problemas}\n\nCopie .env.example para .env e preencha os valores.\n`);
  process.exit(1);
}

const env = resultado.data;

/**
 * Sem JWT_SECRET no .env, derivamos 256 bits via HKDF a partir de DATABASE_URL (que carrega a senha
 * aleatória do Neon) + credenciais do admin. Consequências desejáveis: o segredo é estável entre
 * reinícios, difere entre ambientes e todos os tokens caem se o admin trocar a senha ou o banco rotacionar.
 */
function obterSegredoJwt() {
  if (env.JWT_SECRET) return env.JWT_SECRET;
  const material = Buffer.from([env.DATABASE_URL, env.ADMIN_EMAIL, env.ADMIN_PASSWORD].join('\u0000'));
  return Buffer.from(hkdfSync('sha256', material, 'elizabeth-api/sal-v1', 'jwt-hs256', 32)).toString('hex');
}

const origensCors = env.CORS_ORIGINS.split(',')
  .map((origem) => origem.trim().replace(/\/+$/, ''))
  .filter(Boolean);

export const ambiente = Object.freeze({
  ehProducao: env.NODE_ENV === 'production',
  ehTeste: env.NODE_ENV === 'test',
  porta: env.PORT,
  urlBanco: env.DATABASE_URL,
  admin: Object.freeze({ email: env.ADMIN_EMAIL, senha: env.ADMIN_PASSWORD }),
  origensCors: Object.freeze(origensCors),
  confiarProxy: env.TRUST_PROXY,
  segredoJwt: obterSegredoJwt(),
  expiracaoJwt: env.JWT_EXPIRES_IN,
  expiracaoJwtAdmin: '2h',
  docsAtivo: env.DOCS_ENABLED
});
