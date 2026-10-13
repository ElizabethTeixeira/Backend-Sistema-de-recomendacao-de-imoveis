import { LIMITES, PAPEIS, STATUS_IMOVEL } from '../config/constantes.js';
import * as imovelRepositorio from '../repositorios/imovel.repositorio.js';
import { serializarImovel } from '../serializadores/imovel.serializador.js';
import { naoEncontrado, proibido, requisicaoInvalida } from '../utilitarios/erros.js';
import { avaliarImovel } from '../utilitarios/compatibilidade.js';
import { respostaPaginada } from '../utilitarios/paginacao.js';

// ---- Busca e recomendação (cliente) ----

/**
 * Lista imóveis ativos com a % de compatibilidade, do mais ao menos compatível.
 * Filtros numéricos rodam no banco; compatibilidade e busca por palavras rodam aqui (ver compatibilidade.js).
 */
export async function buscar(criterios) {
  const { pagina, limite, ...filtros } = criterios;
  const candidatos = await imovelRepositorio.listarAtivosCandidatos(filtros, LIMITES.maxCandidatosBusca);

  const avaliados = candidatos
    .map((imovel) => ({ imovel, avaliacao: avaliarImovel(imovel, filtros) }))
    .filter(({ avaliacao }) => avaliacao.aprovado)
    // sort estável: empates mantêm a ordem do banco (mais recentes primeiro)
    .sort((a, b) => (b.avaliacao.percentual ?? 0) - (a.avaliacao.percentual ?? 0));

  const inicio = (pagina - 1) * limite;
  const itens = avaliados
    .slice(inicio, inicio + limite)
    .map(({ imovel, avaliacao }) => serializarImovel(imovel, avaliacao.percentual));

  return respostaPaginada(itens, avaliados.length, { pagina, limite });
}

/**
 * Detalhe com regra de visibilidade por perfil. Quem não pode ver recebe 404 (e não 403),
 * para não revelar que o imóvel existe:
 *  - cliente: só imóveis ativos | corretor: só os próprios | adm: todos
 */
export async function obterDetalhe(autenticado, id, criterios) {
  const imovel = await imovelRepositorio.buscarPorId(id);
  const visivel =
    imovel &&
    (autenticado.papel === PAPEIS.ADM ||
      (autenticado.papel === PAPEIS.CLIENTE && imovel.status === STATUS_IMOVEL.ATIVO) ||
      (autenticado.papel === PAPEIS.CORRETOR && imovel.corretorId === autenticado.id));
  if (!visivel) throw naoEncontrado('Imóvel não encontrado.');

  return serializarImovel(imovel, avaliarImovel(imovel, criterios).percentual);
}

// ---- Gestão (corretor) ----

export async function listarDoCorretor(corretorId) {
  const imoveis = await imovelRepositorio.listarPorCorretor(corretorId);
  return { itens: imoveis.map((imovel) => serializarImovel(imovel)), total: imoveis.length };
}

function dadosDoImovel(entrada) {
  const { fotos, status, ...campos } = entrada;
  return { ...campos, ...(status ? { status } : {}) };
}

export async function criar(corretor, entrada) {
  if (entrada.fotos.some((foto) => !foto.nova)) {
    throw requisicaoInvalida('Ao cadastrar um imóvel, todas as fotos devem ser imagens novas (data URL).');
  }
  if ((await imovelRepositorio.contarPorCorretor(corretor.id)) >= LIMITES.maxImoveisPorCorretor) {
    throw proibido(`Limite de ${LIMITES.maxImoveisPorCorretor} imóveis por corretor atingido.`);
  }

  const imovel = await imovelRepositorio.salvarComFotos({
    corretorId: corretor.id,
    dados: dadosDoImovel(entrada),
    fotos: entrada.fotos
  });
  return serializarImovel(imovel);
}

/** Carrega o imóvel e confirma que pertence ao corretor logado. Outro dono ⇒ 404 (anti-IDOR). */
async function carregarDoCorretor(corretor, id) {
  const imovel = await imovelRepositorio.buscarStatusEDono(id);
  if (!imovel || imovel.corretorId !== corretor.id) throw naoEncontrado('Imóvel não encontrado.');
  return imovel;
}

export async function atualizar(corretor, id, entrada) {
  await carregarDoCorretor(corretor, id);

  const idsAtuais = new Set(await imovelRepositorio.listarIdsDasFotos(id));
  const estranha = entrada.fotos.find((foto) => !foto.nova && !idsAtuais.has(foto.id));
  if (estranha) throw requisicaoInvalida('Uma das fotos informadas não pertence a este imóvel.');

  const imovel = await imovelRepositorio.salvarComFotos({ id, dados: dadosDoImovel(entrada), fotos: entrada.fotos });
  return serializarImovel(imovel);
}

export async function alterarStatus(corretor, id, status) {
  await carregarDoCorretor(corretor, id);
  return serializarImovel(await imovelRepositorio.atualizarStatus(id, status));
}

/** O corretor exclui os próprios imóveis; o admin pode excluir qualquer um (moderação). */
export async function excluir(autenticado, id) {
  if (autenticado.papel === PAPEIS.ADM) {
    if (!(await imovelRepositorio.buscarStatusEDono(id))) throw naoEncontrado('Imóvel não encontrado.');
  } else {
    await carregarDoCorretor(autenticado, id);
  }
  await imovelRepositorio.excluir(id);
}
