import bcrypt from 'bcryptjs';
import { createHash, timingSafeEqual } from 'node:crypto';
import { ambiente } from '../config/ambiente.js';

const CUSTO_BCRYPT = 12;

// Hash descartável usado para gastar o mesmo tempo quando o e-mail não existe,
// evitando que o tempo de resposta revele quais e-mails estão cadastrados.
const hashFalso = bcrypt.hashSync('senha-falsa-para-igualar-o-tempo', CUSTO_BCRYPT);

export function gerarHashSenha(senha) {
  return bcrypt.hash(senha, CUSTO_BCRYPT);
}

export function conferirSenha(senha, hash) {
  return bcrypt.compare(senha, hash);
}

export function conferirSenhaContraHashFalso(senha) {
  return bcrypt.compare(senha, hashFalso);
}

/** Comparação de texto em tempo constante (compara os SHA-256, que têm sempre o mesmo tamanho). */
export function igualdadeSegura(a, b) {
  const hashA = createHash('sha256').update(String(a)).digest();
  const hashB = createHash('sha256').update(String(b)).digest();
  return timingSafeEqual(hashA, hashB);
}

// A senha do admin vem do .env em texto puro; guardamos só o hash dela em memória.
let hashAdminEmCache;
export function obterHashAdmin() {
  hashAdminEmCache ??= gerarHashSenha(ambiente.admin.senha);
  return hashAdminEmCache;
}
