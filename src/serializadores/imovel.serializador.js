import { PREFIXO_API } from '../config/constantes.js';
import { serializarCorretorPublico } from './usuario.serializador.js';

export const urlFotoImovel = (idFoto) => `${PREFIXO_API}/midia/imoveis/${idFoto}`;

/**
 * `imovel` deve vir com `fotos: [{ id }]` (ordenadas) e `corretor` (campos públicos).
 * `compatibilidade` (0-100) só é incluída quando o cliente informou algum critério de busca.
 */
export function serializarImovel(imovel, compatibilidade) {
  const dto = {
    id: imovel.id,
    corretorId: imovel.corretorId,
    tipo: imovel.tipo,
    bairro: imovel.bairro,
    preco: imovel.preco,
    quartos: imovel.quartos,
    vagas: imovel.vagas,
    areaM2: imovel.areaM2,
    status: imovel.status,
    caracteristicas: imovel.caracteristicas,
    //fotos: imovel.fotos.map((foto) => urlFotoImovel(foto.id)),
    corretor: imovel.corretor ? serializarCorretorPublico(imovel.corretor) : null,
    criadoEm: imovel.criadoEm.toISOString(),
    atualizadoEm: imovel.atualizadoEm.toISOString()
  };
  if (compatibilidade !== undefined) dto.compatibilidade = compatibilidade;
  return dto;
}

/** Resumo do imóvel dentro de uma conversa (o front exibe "Imóvel removido" quando vier null). */
export function serializarImovelResumido(imovel) {
  if (!imovel) return null;
  return {
    id: imovel.id,
    tipo: imovel.tipo,
    bairro: imovel.bairro,
    capa: imovel.fotos?.[0] ? urlFotoImovel(imovel.fotos[0].id) : null
  };
}
