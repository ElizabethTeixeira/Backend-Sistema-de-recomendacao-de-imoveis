/** Erro de negócio/HTTP com status e código estável, tratado de forma central em middlewares/tratadorErros.js */
export class ErroApp extends Error {
  constructor(status, codigo, mensagem, detalhes) {
    super(mensagem);
    this.name = 'ErroApp';
    this.status = status;
    this.codigo = codigo;
    this.detalhes = detalhes;
  }
}

export const requisicaoInvalida = (mensagem, detalhes) =>
  new ErroApp(400, 'REQUISICAO_INVALIDA', mensagem, detalhes);

export const naoAutenticado = (mensagem = 'Autenticação necessária.') =>
  new ErroApp(401, 'NAO_AUTENTICADO', mensagem);

export const credenciaisInvalidas = () =>
  new ErroApp(401, 'CREDENCIAIS_INVALIDAS', 'E-mail ou senha inválidos.');

export const proibido = (mensagem = 'Você não tem permissão para esta ação.') =>
  new ErroApp(403, 'PROIBIDO', mensagem);

export const naoEncontrado = (mensagem = 'Recurso não encontrado.') =>
  new ErroApp(404, 'NAO_ENCONTRADO', mensagem);

export const conflito = (mensagem, detalhes) => new ErroApp(409, 'CONFLITO', mensagem, detalhes);

export const muitasRequisicoes = (mensagem = 'Muitas requisições. Tente novamente em instantes.') =>
  new ErroApp(429, 'MUITAS_REQUISICOES', mensagem);
