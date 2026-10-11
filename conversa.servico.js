import { PAPEIS, STATUS_IMOVEL } from '../config/constantes.js';
import * as conversaRepositorio from '../repositorios/conversa.repositorio.js';
import * as imovelRepositorio from '../repositorios/imovel.repositorio.js';
import { serializarConversa } from '../serializadores/conversa.serializador.js';
import { naoEncontrado } from '../utilitarios/erros.js';
import { calcularDeslocamento, respostaPaginada } from '../utilitarios/paginacao.js';

/** Só participa da conversa quem é o cliente ou o corretor dela. Qualquer outro recebe 404. */
async function exigirParticipante(usuario, conversaId) {
  const conversa = await conversaRepositorio.buscarParticipantes(conversaId);
  const participa =
    conversa &&
    (usuario.papel === PAPEIS.CLIENTE ? conversa.clienteId === usuario.id : conversa.corretorId === usuario.id);
  if (!participa) throw naoEncontrado('Conversa não encontrada.');
}

/** Cliente escreve ao corretor sobre um imóvel ativo (abre a conversa ou continua a existente). */
export async function enviarMensagemSobreImovel(cliente, imovelId, texto) {
  const imovel = await imovelRepositorio.buscarStatusEDono(imovelId);
  if (!imovel || imovel.status !== STATUS_IMOVEL.ATIVO) throw naoEncontrado('Imóvel não encontrado.');

  const { id } = await conversaRepositorio.registrarMensagemDoCliente({
    imovelId,
    clienteId: cliente.id,
    corretorId: imovel.corretorId,
    texto
  });
  return serializarConversa(await conversaRepositorio.buscarParaLeitor(id, PAPEIS.CLIENTE), PAPEIS.CLIENTE);
}

export async function responder(usuario, conversaId, texto) {
  await exigirParticipante(usuario, conversaId);
  await conversaRepositorio.registrarMensagem({ conversaId, remetente: usuario.papel, texto });
  return serializarConversa(await conversaRepositorio.buscarParaLeitor(conversaId, usuario.papel), usuario.papel);
}

export async function listar(usuario, { pagina, limite }) {
  const [conversas, total] = await Promise.all([
    conversaRepositorio.listarDoUsuario(usuario.papel, usuario.id, calcularDeslocamento({ pagina, limite })),
    conversaRepositorio.contarDoUsuario(usuario.papel, usuario.id)
  ]);
  const itens = conversas.map((conversa) => serializarConversa(conversa, usuario.papel));
  return respostaPaginada(itens, total, { pagina, limite });
}

export async function contarNaoLidas(usuario) {
  return { total: await conversaRepositorio.contarMensagensNaoLidas(usuario.papel, usuario.id) };
}

/** `conversaId` omitido = marca todas as conversas do usuário (o que o sininho do front faz ao abrir). */
export async function marcarComoLidas(usuario, conversaId) {
  if (conversaId) await exigirParticipante(usuario, conversaId);
  return { marcadas: await conversaRepositorio.marcarComoLidas(usuario.papel, usuario.id, conversaId) };
}
