import { banco } from '../banco/cliente.js';

/** Acesso à tabela `usuarios` (clientes e corretores). Nenhuma regra de negócio aqui. */

export const buscarPorId = (id) => banco.usuario.findUnique({ where: { id } });

export const buscarPorIdEPapel = (id, papel) => banco.usuario.findFirst({ where: { id, papel } });

/** Único lugar (além de trocar senha) em que o hash é lido do banco. */
export const buscarPorEmailEPapelComSenha = (email, papel) =>
  banco.usuario.findFirst({ where: { email, papel }, omit: { senhaHash: false } });

export const buscarPorIdComSenha = (id) =>
  banco.usuario.findUnique({ where: { id }, omit: { senhaHash: false } });

/** Mínimo necessário para validar um JWT a cada requisição (consulta por chave primária). */
export const buscarCredencialPorId = (id) =>
  banco.usuario.findUnique({ where: { id }, select: { id: true, papel: true, nome: true, email: true, versaoToken: true } });

export const criar = (dados) => banco.usuario.create({ data: dados });

export const atualizar = (id, dados) => banco.usuario.update({ where: { id }, data: dados });

export const excluir = (id) => banco.usuario.delete({ where: { id } });

export const incrementarVersaoToken = (id) =>
  banco.usuario.update({ where: { id }, data: { versaoToken: { increment: 1 } }, select: { versaoToken: true } });

export const obterFotoPerfil = (id) =>
  banco.usuario.findFirst({
    where: { id, papel: 'corretor', fotoDados: { not: null } },
    select: { fotoDados: true, fotoTipoMime: true, fotoAtualizadaEm: true }
  });

/**
 * Descobre quais campos únicos já estão em uso (para mensagem amigável).
 * E-mail é único entre TODOS os usuários; CPF só dentro do mesmo papel; CRECI entre corretores.
 */
export async function buscarConflitos({ email, cpf, creci, papel, ignorarId }) {
  const alternativas = [{ email }, { papel, cpf }];
  if (creci) alternativas.push({ creci });

  const encontrados = await banco.usuario.findMany({
    where: { OR: alternativas, ...(ignorarId ? { id: { not: ignorarId } } : {}) },
    select: { email: true, cpf: true, papel: true, creci: true }
  });

  const campos = new Set();
  for (const item of encontrados) {
    if (item.email === email) campos.add('email');
    if (item.papel === papel && item.cpf === cpf) campos.add('cpf');
    if (creci && item.creci === creci) campos.add('creci');
  }
  return [...campos];
}

export function listarPorPapel(papel, { busca, pular, tomar }) {
  return banco.usuario.findMany({
    where: filtroBusca(papel, busca),
    orderBy: [{ nome: 'asc' }, { id: 'asc' }],
    skip: pular,
    take: tomar
  });
}

export const contarPorPapel = (papel, busca) => banco.usuario.count({ where: filtroBusca(papel, busca) });

function filtroBusca(papel, busca) {
  if (!busca) return { papel };
  return {
    papel,
    OR: [
      { nome: { contains: busca, mode: 'insensitive' } },
      { email: { contains: busca, mode: 'insensitive' } }
    ]
  };
}
