/** Constantes de domínio e limites de segurança usados por toda a aplicação. */

export const PREFIXO_API = '/api/v1';

// Vocabulário igual ao do front-end (sessao.tipo: 'adm' | 'cliente' | 'corretor').
export const PAPEIS = Object.freeze({
  ADM: 'adm',
  CLIENTE: 'cliente',
  CORRETOR: 'corretor'
});

export const STATUS_IMOVEL = Object.freeze({
  ATIVO: 'ativo',
  INATIVO: 'inativo'
});

export const TIPOS_IMOVEL = Object.freeze(['Casa', 'Apartamento', 'Terreno', 'Sobrado', 'Kitnet', 'Chácara']);

export const TIPOS_IMAGEM_PERMITIDOS = Object.freeze(['image/jpeg', 'image/png', 'image/webp']);

const MEGABYTE = 1024 * 1024;

export const LIMITES = Object.freeze({
  senhaMinima: 8,
  senhaMaximaBytes: 72, // limite do bcrypt: acima disso o hash ignoraria o restante da senha

  maxFotosPorImovel: 10,
  maxBytesPorFoto: Math.floor(1.5 * MEGABYTE),
  maxImoveisPorCorretor: 200,
  maxCaracteristicas: 30,
  maxCaracteresCaracteristica: 60,

  maxCaracteresMensagem: 2000,
  maxMensagensPorConversa: 50,

  // Limite de corpo JSON por tipo de rota (o padrão é pequeno de propósito).
  corpoPadrao: '32kb',
  corpoComFotoPerfil: '3mb',
  corpoComFotosImovel: '22mb', // 10 fotos de 1,5 MB em base64 (+33%) + folga

  // Teto de imóveis carregados em memória para calcular a compatibilidade.
  maxCandidatosBusca: 1000
});
