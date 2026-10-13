import { ambiente } from '../config/ambiente.js';
import { PAPEIS } from '../config/constantes.js';
import * as usuarioRepositorio from '../repositorios/usuario.repositorio.js';
import { serializarAdmin, serializarUsuario } from '../serializadores/usuario.serializador.js';
import { credenciaisInvalidas } from '../utilitarios/erros.js';
import {
  conferirSenha,
  conferirSenhaContraHashFalso,
  igualdadeSegura,
  obterHashAdmin
} from '../utilitarios/senha.js';
import { gerarToken } from '../utilitarios/token.js';
import * as usuarioServico from './usuario.servico.js';

const NOME_DO_ADMIN = 'Administrador';

/** Resposta padrão de sessão: token Bearer + dados do usuário. */
export function emitirSessao(usuario) {
  const { token, expiraEm } = gerarToken(
    { sub: usuario.id, papel: usuario.papel, versao: usuario.versaoToken },
    ambiente.expiracaoJwt
  );
  return { token, tipo: 'Bearer', expiraEm, usuario: serializarUsuario(usuario) };
}

export async function cadastrar(papel, dados) {
  const usuario = await usuarioServico.criar(papel, dados);
  return emitirSessao(usuario);
}

export async function entrar({ papel, email, senha }) {
  return papel === PAPEIS.ADM ? entrarComoAdmin(email, senha) : entrarComoUsuario(papel, email, senha);
}

async function entrarComoUsuario(papel, email, senha) {
  const usuario = await usuarioRepositorio.buscarPorEmailEPapelComSenha(email, papel);

  // Sempre gasta uma comparação de bcrypt, exista ou não o e-mail: o tempo não revela cadastros.
  const senhaConfere = usuario
    ? await conferirSenha(senha, usuario.senhaHash)
    : await conferirSenhaContraHashFalso(senha);

  if (!usuario || !senhaConfere) throw credenciaisInvalidas();

  const { senhaHash, ...usuarioSemSenha } = usuario;
  return emitirSessao(usuarioSemSenha);
}

/** O admin não está no banco: credenciais vêm do .env. Avalia e-mail e senha sempre, sem atalhos. */
async function entrarComoAdmin(email, senha) {
  const emailConfere = igualdadeSegura(email, ambiente.admin.email);
  const senhaConfere = await conferirSenha(senha, await obterHashAdmin());
  if (!emailConfere || !senhaConfere) throw credenciaisInvalidas();

  const { token, expiraEm } = gerarToken({ sub: PAPEIS.ADM, papel: PAPEIS.ADM }, ambiente.expiracaoJwtAdmin);
  return {
    token,
    tipo: 'Bearer',
    expiraEm,
    usuario: serializarAdmin({ nome: NOME_DO_ADMIN, email: ambiente.admin.email })
  };
}

/**
 * "Sair em todos os dispositivos": subir a versão invalida todo JWT emitido antes para este usuário.
 * O token do admin não tem revogação individual (expira em 2 h; trocar ADMIN_PASSWORD derruba todos).
 */
export async function sair(autenticado) {
  if (autenticado.papel !== PAPEIS.ADM) await usuarioRepositorio.incrementarVersaoToken(autenticado.id);
}
