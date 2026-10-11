import { banco } from '../banco/cliente.js';
import { LIMITES, PAPEIS } from '../config/constantes.js';

/** Acesso às tabelas `conversas` e `mensagens`. */

/** Coluna que identifica o usuário conforme o papel dele na conversa. */
const colunaDoPapel = (papel) => (papel === PAPEIS.CLIENTE ? 'clienteId' : 'corretorId');
const papelOposto = (papel) => (papel === PAPEIS.CLIENTE ? PAPEIS.CORRETOR : PAPEIS.CLIENTE);

const incluirConversa = (papelDoLeitor) => ({
  imovel: { select: { id: true, tipo: true, bairro: true, fotos: { select: { id: true }, orderBy: { ordem: 'asc' }, take: 1 } } },
  cliente: { select: { id: true, nome: true } },
  corretor: { select: { id: true, nome: true } },
  // últimas N mensagens (decrescente); o serializador as inverte para a ordem cronológica
  mensagens: { orderBy: { criadoEm: 'desc' }, take: LIMITES.maxMensagensPorConversa },
  // não lidas = mensagens da outra ponta ainda não lidas por quem está consultando
  _count: { select: { mensagens: { where: { lida: false, remetente: papelOposto(papelDoLeitor) } } } }
});

export const buscarParticipantes = (id) =>
  banco.conversa.findUnique({ where: { id }, select: { id: true, clienteId: true, corretorId: true } });

/**
 * Devolve a conversa do (imóvel, cliente), criando-a se ainda não existir.
 * Seguro contra envios simultâneos (ex.: clique duplo em "Enviar"): a restrição única do banco garante
 * uma só conversa e quem perde a corrida (P2002) apenas busca a que o vencedor criou.
 * Obs.: `upsert` do Prisma não serviria aqui, pois com escrita aninhada ele não é atômico no banco.
 */
async function obterOuCriarConversa({ imovelId, clienteId, corretorId }) {
  const chave = { imovelId_clienteId: { imovelId, clienteId } };
  const existente = await banco.conversa.findUnique({ where: chave, select: { id: true } });
  if (existente) return existente;

  try {
    return await banco.conversa.create({ data: { imovelId, clienteId, corretorId }, select: { id: true } });
  } catch (erro) {
    if (erro.code !== 'P2002') throw erro;
    return banco.conversa.findUniqueOrThrow({ where: chave, select: { id: true } });
  }
}

/** Registra uma mensagem do CLIENTE sobre um imóvel, abrindo a conversa se for a primeira. */
export async function registrarMensagemDoCliente({ imovelId, clienteId, corretorId, texto }) {
  const conversa = await obterOuCriarConversa({ imovelId, clienteId, corretorId });
  return registrarMensagem({ conversaId: conversa.id, remetente: PAPEIS.CLIENTE, texto });
}

/** Mensagem dentro de conversa já existente (cliente ou corretor). */
export function registrarMensagem({ conversaId, remetente, texto }) {
  return banco.conversa.update({
    where: { id: conversaId },
    data: { atualizadoEm: new Date(), mensagens: { create: { remetente, texto } } },
    select: { id: true }
  });
}

export function buscarParaLeitor(id, papel) {
  return banco.conversa.findUnique({ where: { id }, include: incluirConversa(papel) });
}

export function listarDoUsuario(papel, usuarioId, { pular, tomar }) {
  return banco.conversa.findMany({
    where: { [colunaDoPapel(papel)]: usuarioId },
    orderBy: { atualizadoEm: 'desc' },
    skip: pular,
    take: tomar,
    include: incluirConversa(papel)
  });
}

export const contarDoUsuario = (papel, usuarioId) =>
  banco.conversa.count({ where: { [colunaDoPapel(papel)]: usuarioId } });

export const contarMensagensNaoLidas = (papel, usuarioId) =>
  banco.mensagem.count({
    where: { lida: false, remetente: papelOposto(papel), conversa: { [colunaDoPapel(papel)]: usuarioId } }
  });

/** Marca como lidas as mensagens da outra ponta; `conversaId` omitido = todas as conversas do usuário. */
export async function marcarComoLidas(papel, usuarioId, conversaId) {
  const resultado = await banco.mensagem.updateMany({
    where: {
      lida: false,
      remetente: papelOposto(papel),
      conversa: { [colunaDoPapel(papel)]: usuarioId, ...(conversaId ? { id: conversaId } : {}) }
    },
    data: { lida: true }
  });
  return resultado.count;
}
