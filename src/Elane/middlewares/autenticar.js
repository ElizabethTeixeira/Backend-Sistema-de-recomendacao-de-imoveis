import { ambiente } from '../config/ambiente.js';
import { PAPEIS } from '../config/constantes.js';
import * as usuarioRepositorio from '../repositorios/usuario.repositorio.js';
import { ErroApp, naoAutenticado } from '../utilitarios/erros.js';
import { verificarToken } from '../utilitarios/token.js';

function lerTokenDoCabecalho(req) {
  const [esquema, token, ...sobra] = (req.get('authorization') ?? '').split(' ');
  if (esquema?.toLowerCase() !== 'bearer' || !token || sobra.length > 0) return null;
  return token;
}

function recusar(mensagem) {
  const erro = naoAutenticado(mensagem);
  erro.cabecalhos = { 'WWW-Authenticate': 'Bearer' };
  return erro;
}

/**
 * Exige `Authorization: Bearer <jwt>` e popula `req.usuario = { id, papel, nome, email }`.
 * Além da assinatura, confere no banco que o usuário ainda existe e que o token não foi revogado
 * (versão do token): excluir a conta ou fazer logout derruba o acesso na hora, não só no vencimento.
 */
export async function autenticar(req, res, next) {
  const token = lerTokenDoCabecalho(req);
  if (!token) throw recusar('Token de acesso ausente.');

  let carga;
  try {
    carga = verificarToken(token);
  } catch {
    throw recusar('Token inválido ou expirado.');
  }

  if (carga.papel === PAPEIS.ADM) {
    if (carga.sub !== PAPEIS.ADM) throw recusar('Token inválido.');
    req.usuario = { id: null, papel: PAPEIS.ADM, nome: 'Administrador', email: ambiente.admin.email };
    return next();
  }

  const id = Number(carga.sub);
  if (!Number.isInteger(id) || id <= 0) throw recusar('Token inválido.');

  const usuario = await usuarioRepositorio.buscarCredencialPorId(id);
  if (!usuario || usuario.papel !== carga.papel || usuario.versaoToken !== carga.ver) {
    throw recusar('Sessão encerrada. Faça login novamente.');
  }

  req.usuario = usuario;
  return next();
}

/** Autorização por perfil. Use sempre depois de `autenticar`. */
export const exigirPapel =
  (...papeisPermitidos) =>
  (req, res, next) => {
    if (!papeisPermitidos.includes(req.usuario?.papel)) {
      throw new ErroApp(403, 'PROIBIDO', 'Seu perfil não tem permissão para acessar este recurso.');
    }
    next();
  };
