import { PAPEIS } from '../config/constantes.js';
import * as imovelRepositorio from '../repositorios/imovel.repositorio.js';
import * as usuarioRepositorio from '../repositorios/usuario.repositorio.js';

/** Totais exibidos no dashboard do administrador. */
export async function obterResumo() {
  const [totalClientes, totalCorretores, totalImoveis] = await Promise.all([
    usuarioRepositorio.contarPorPapel(PAPEIS.CLIENTE),
    usuarioRepositorio.contarPorPapel(PAPEIS.CORRETOR),
    imovelRepositorio.contarTodos()
  ]);
  return { totalClientes, totalCorretores, totalImoveis };
}
