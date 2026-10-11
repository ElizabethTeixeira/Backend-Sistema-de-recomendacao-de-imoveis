import { PAPEIS } from '../config/constantes.js';
import { serializarImovelResumido } from './imovel.serializador.js';

export function serializarMensagem(mensagem) {
  return {
    id: mensagem.id,
    texto: mensagem.texto,
    remetente: mensagem.remetente,
    data: mensagem.criadoEm.toISOString(),
    lida: mensagem.lida
  };
}

/**
 * Visão da conversa para quem está logado: o `interlocutor` é sempre a OUTRA ponta
 * (para o cliente é o corretor e vice-versa), e só expõe id e nome.
 * `conversa.mensagens` deve vir em ordem decrescente (as mais recentes); aqui viram cronológicas.
 */
export function serializarConversa(conversa, papelDoLeitor) {
  const interlocutor = papelDoLeitor === PAPEIS.CLIENTE ? conversa.corretor : conversa.cliente;
  return {
    id: conversa.id,
    imovel: serializarImovelResumido(conversa.imovel),
    interlocutor: { id: interlocutor.id, nome: interlocutor.nome },
    mensagens: [...conversa.mensagens].reverse().map(serializarMensagem),
    naoLidas: conversa._count.mensagens,
    atualizadaEm: conversa.atualizadoEm.toISOString()
  };
}
