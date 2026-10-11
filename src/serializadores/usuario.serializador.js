import { PREFIXO_API } from '../config/constantes.js';
import { formatarCpf, formatarTelefone } from '../utilitarios/documentos.js';

/** Data pura (coluna DATE) como AAAA-MM-DD, igual ao <input type="date"> do front. */
const dataPura = (data) => data.toISOString().slice(0, 10);

/**
 * URL da foto do corretor. O `?v=` muda a cada troca de foto e força o navegador a recarregar.
 * Relativa à raiz da API: o front deve prefixar com a URL base do backend.
 */
export function urlFotoCorretor(usuario) {
  if (usuario.papel !== 'corretor' || !usuario.fotoAtualizadaEm) return null;
  return `${PREFIXO_API}/midia/corretores/${usuario.id}?v=${usuario.fotoAtualizadaEm.getTime()}`;
}

/** Dados completos: só o próprio usuário e o admin recebem (inclui CPF, e-mail e data de nascimento). */
export function serializarUsuario(usuario) {
  const base = {
    id: usuario.id,
    papel: usuario.papel,
    nome: usuario.nome,
    email: usuario.email,
    telefone: formatarTelefone(usuario.telefone),
    cpf: formatarCpf(usuario.cpf),
    dataNascimento: dataPura(usuario.dataNascimento),
    criadoEm: usuario.criadoEm.toISOString()
  };
  if (usuario.papel === 'corretor') {
    return { ...base, creci: usuario.creci, foto: urlFotoCorretor(usuario) };
  }
  return base;
}

/** Dados de vitrine do corretor exibidos aos clientes: sem CPF, sem e-mail, sem nascimento. */
export function serializarCorretorPublico(corretor) {
  return {
    id: corretor.id,
    nome: corretor.nome,
    telefone: formatarTelefone(corretor.telefone),
    creci: corretor.creci,
    foto: urlFotoCorretor({ ...corretor, papel: 'corretor' })
  };
}

export function serializarAdmin(admin) {
  return { id: null, papel: 'adm', nome: admin.nome, email: admin.email };
}
