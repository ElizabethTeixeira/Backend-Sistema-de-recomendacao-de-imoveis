import { createHash } from 'node:crypto';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { muitasRequisicoes } from '../utilitarios/erros.js';

/**
 * Limitação de taxa (armazenamento em memória do processo).
 * Atenção: com mais de uma instância do servidor, cada uma conta separado; nesse caso trocar o `store`
 * por um compartilhado (ex.: Redis). Atrás de proxy (Render etc.) defina TRUST_PROXY, senão todos os
 * usuários parecem ter o mesmo IP do proxy.
 */

const MINUTO = 60 * 1000;
const HORA = 60 * MINUTO;

function criarLimitador({ janelaMs, limite, mensagem, chave, ignorarSucessos = false }) {
  return rateLimit({
    windowMs: janelaMs,
    limit: limite,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skipSuccessfulRequests: ignorarSucessos,
    keyGenerator: chave ?? ((req) => ipKeyGenerator(req.ip)),
    handler: (req, res, next) => next(muitasRequisicoes(mensagem))
  });
}

/** Chave por usuário logado (cai para o IP se, por algum motivo, não houver usuário). */
const chavePorUsuario = (req) =>
  req.usuario ? `${req.usuario.papel}:${req.usuario.id ?? 'adm'}` : ipKeyGenerator(req.ip);

/** Chave por e-mail informado no login, em hash (não guardamos o e-mail em memória). */
const chavePorEmail = (req) => {
  const email = req.validado?.corpo?.email;
  return email
    ? `email:${createHash('sha256').update(`${req.validado.corpo.papel}:${email}`).digest('hex')}`
    : ipKeyGenerator(req.ip);
};

/** Teto geral por IP, para todas as rotas. */
export const limitadorGlobal = criarLimitador({ janelaMs: 15 * MINUTO, limite: 600, mensagem: 'Muitas requisições deste IP. Aguarde alguns minutos.' });

/** Força bruta no login, por IP: só falhas contam (login correto não consome o limite). */
export const limitadorLoginPorIp = criarLimitador({
  janelaMs: 15 * MINUTO,
  limite: 20,
  ignorarSucessos: true,
  mensagem: 'Muitas tentativas de login. Aguarde 15 minutos e tente novamente.'
});

/** Força bruta distribuída (vários IPs contra uma mesma conta). Roda DEPOIS da validação do corpo. */
export const limitadorLoginPorEmail = criarLimitador({
  janelaMs: HORA,
  limite: 15,
  ignorarSucessos: true,
  chave: chavePorEmail,
  mensagem: 'Muitas tentativas de login para esta conta. Aguarde e tente novamente mais tarde.'
});

export const limitadorCadastro = criarLimitador({
  janelaMs: HORA,
  limite: 20,
  mensagem: 'Muitos cadastros deste IP. Tente novamente mais tarde.'
});

/** Criar/editar/excluir (inclui o upload de fotos, que é caro). Por usuário. */
export const limitadorEscrita = criarLimitador({
  janelaMs: MINUTO,
  limite: 30,
  chave: chavePorUsuario,
  mensagem: 'Muitas alterações em pouco tempo. Aguarde um instante.'
});

export const limitadorMensagens = criarLimitador({
  janelaMs: MINUTO,
  limite: 20,
  chave: chavePorUsuario,
  mensagem: 'Você está enviando mensagens rápido demais. Aguarde um instante.'
});

/** Tentativas falhas de trocar e-mail/senha no perfil (protege a "senha atual" contra token roubado). */
export const limitadorTrocaDeCredenciais = criarLimitador({
  janelaMs: 15 * MINUTO,
  limite: 5,
  ignorarSucessos: true,
  chave: chavePorUsuario,
  mensagem: 'Muitas tentativas. Aguarde 15 minutos para alterar e-mail ou senha.'
});
