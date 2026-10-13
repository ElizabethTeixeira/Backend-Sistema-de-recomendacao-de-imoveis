import * as imovelRepositorio from '../repositorios/imovel.repositorio.js';
import * as usuarioRepositorio from '../repositorios/usuario.repositorio.js';
import { naoEncontrado } from '../utilitarios/erros.js';

/** Bytes e tipo da foto de um imóvel (identificada por UUID não sequencial). */
export async function obterFotoDoImovel(idFoto) {
  const foto = await imovelRepositorio.obterFoto(idFoto);
  if (!foto) throw naoEncontrado('Foto não encontrada.');
  return { tipoMime: foto.tipoMime, dados: foto.dados };
}

export async function obterFotoDoCorretor(corretorId) {
  const corretor = await usuarioRepositorio.obterFotoPerfil(corretorId);
  if (!corretor) throw naoEncontrado('Foto não encontrada.');
  return { tipoMime: corretor.fotoTipoMime, dados: corretor.fotoDados };
}
