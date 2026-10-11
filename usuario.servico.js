import { PAPEIS } from '../config/constantes.js';
import * as usuarioRepositorio from '../repositorios/usuario.repositorio.js';
import { serializarUsuario } from '../serializadores/usuario.serializador.js';
import { conflito, naoEncontrado } from '../utilitarios/erros.js';
import { calcularDeslocamento, respostaPaginada } from '../utilitarios/paginacao.js';
import { gerarHashSenha } from '../utilitarios/senha.js';

/**
 * Regras comuns de clientes e corretores. É usado pelo cadastro público, pelo perfil do próprio usuário
 * e pelo CRUD do administrador, para que as três portas apliquem exatamente as mesmas regras.
 */

const MENSAGEM_CONFLITO = {
  email: 'Este e-mail já está em uso.',
  cpf: 'Este CPF já está cadastrado.',
  creci: 'Este CRECI já está cadastrado.'
};

async function garantirSemConflitos({ email, cpf, creci, papel, ignorarId }) {
  const campos = await usuarioRepositorio.buscarConflitos({ email, cpf, creci, papel, ignorarId });
  if (campos.length === 0) return;
  throw conflito(
    MENSAGEM_CONFLITO[campos[0]],
    campos.map((campo) => ({ campo: `corpo.${campo}`, mensagem: MENSAGEM_CONFLITO[campo] }))
  );
}

/** Traduz o resultado da validação de `foto` em colunas. undefined / {manter} não alteram nada. */
function colunasDaFoto(foto) {
  if (foto === undefined || foto?.manter) return {};
  if (foto === null) return { fotoTipoMime: null, fotoDados: null, fotoAtualizadaEm: null };
  return { fotoTipoMime: foto.tipoMime, fotoDados: foto.dados, fotoAtualizadaEm: new Date() };
}

function colunasDoPapel(papel, dados) {
  return papel === PAPEIS.CORRETOR ? { creci: dados.creci, ...colunasDaFoto(dados.foto) } : {};
}

export async function criar(papel, dados) {
  await garantirSemConflitos({ email: dados.email, cpf: dados.cpf, creci: dados.creci, papel });

  return usuarioRepositorio.criar({
    papel,
    nome: dados.nome,
    email: dados.email,
    telefone: dados.telefone,
    cpf: dados.cpf,
    dataNascimento: dados.dataNascimento,
    senhaHash: await gerarHashSenha(dados.senha),
    ...colunasDoPapel(papel, dados)
  });
}

/**
 * Atualiza um usuário já carregado. `dados.novaSenha` (opcional) troca a senha e invalida os tokens antigos.
 * A autorização (quem pode editar quem) e a conferência da senha atual são feitas por quem chama.
 */
export async function atualizar(usuario, dados) {
  await garantirSemConflitos({
    email: dados.email,
    cpf: dados.cpf,
    creci: usuario.papel === PAPEIS.CORRETOR ? dados.creci : undefined,
    papel: usuario.papel,
    ignorarId: usuario.id
  });

  const alteracoes = {
    nome: dados.nome,
    email: dados.email,
    telefone: dados.telefone,
    cpf: dados.cpf,
    dataNascimento: dados.dataNascimento,
    ...colunasDoPapel(usuario.papel, dados)
  };

  if (dados.novaSenha) {
    alteracoes.senhaHash = await gerarHashSenha(dados.novaSenha);
    alteracoes.versaoToken = { increment: 1 };
  }

  return usuarioRepositorio.atualizar(usuario.id, alteracoes);
}

// ---- Operações do administrador ----

export async function listarParaAdmin(papel, { busca, pagina, limite }) {
  const [usuarios, total] = await Promise.all([
    usuarioRepositorio.listarPorPapel(papel, { busca, ...calcularDeslocamento({ pagina, limite }) }),
    usuarioRepositorio.contarPorPapel(papel, busca)
  ]);
  return respostaPaginada(usuarios.map(serializarUsuario), total, { pagina, limite });
}

async function carregarOuFalhar(papel, id) {
  const usuario = await usuarioRepositorio.buscarPorIdEPapel(id, papel);
  if (!usuario) throw naoEncontrado(papel === PAPEIS.CLIENTE ? 'Cliente não encontrado.' : 'Corretor não encontrado.');
  return usuario;
}

export async function obterParaAdmin(papel, id) {
  return serializarUsuario(await carregarOuFalhar(papel, id));
}

export async function criarPeloAdmin(papel, dados) {
  return serializarUsuario(await criar(papel, dados));
}

export async function atualizarPeloAdmin(papel, id, dados) {
  const usuario = await carregarOuFalhar(papel, id);
  const atualizado = await atualizar(usuario, { ...dados, novaSenha: dados.senha });
  return serializarUsuario(atualizado);
}

/** Exclusão em cascata: imóveis, fotos e conversas do usuário somem junto (ver prisma/schema.prisma). */
export async function excluirPeloAdmin(papel, id) {
  await carregarOuFalhar(papel, id);
  await usuarioRepositorio.excluir(id);
}
