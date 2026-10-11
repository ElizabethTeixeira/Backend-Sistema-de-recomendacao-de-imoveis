import { normalizarTexto } from './texto.js';

/**
 * Núcleo da recomendação: replica a regra que o front já usava (pages/cliente/dashboard.js),
 * agora no servidor. Cada critério informado conta 1 ponto; cada palavra da busca livre conta 1 ponto.
 * Os filtros estruturados são eliminatórios; a busca livre só elimina se NENHUMA palavra casar.
 * `percentual` = critérios atendidos / critérios informados (null quando não há critério algum).
 *
 * @param {object} imovel   { tipo, bairro, preco, quartos, vagas, caracteristicas }
 * @param {object} criterios { busca, tipo, bairro, precoMin, precoMax, quartos, vagas }
 * @returns {{ aprovado: boolean, percentual: number | null }}
 */
export function avaliarImovel(imovel, criterios) {
  let total = 0;
  let atendidos = 0;
  let aprovado = true;

  const verificar = (informado, atende) => {
    if (!informado) return;
    total += 1;
    if (atende) atendidos += 1;
    else aprovado = false;
  };

  verificar(criterios.tipo, imovel.tipo === criterios.tipo);

  const bairroBuscado = normalizarTexto(criterios.bairro);
  verificar(bairroBuscado, normalizarTexto(imovel.bairro).includes(bairroBuscado));

  const temMin = criterios.precoMin != null;
  const temMax = criterios.precoMax != null;
  verificar(
    temMin || temMax,
    (!temMin || imovel.preco >= criterios.precoMin) && (!temMax || imovel.preco <= criterios.precoMax)
  );

  verificar(criterios.quartos, imovel.quartos >= criterios.quartos);
  verificar(criterios.vagas, imovel.vagas >= criterios.vagas);

  const palavras = normalizarTexto(criterios.busca).split(/\s+/).filter(Boolean);
  if (palavras.length > 0) {
    const alvo = normalizarTexto(`${imovel.tipo} ${imovel.bairro} ${imovel.caracteristicas.join(' ')}`);
    const casadas = palavras.filter((palavra) => alvo.includes(palavra)).length;
    total += palavras.length;
    atendidos += casadas;
    if (casadas === 0) aprovado = false;
  }

  return { aprovado, percentual: total > 0 ? Math.round((atendidos / total) * 100) : null };
}
