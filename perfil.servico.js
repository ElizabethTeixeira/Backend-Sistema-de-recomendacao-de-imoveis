import { ambiente } from '../config/ambiente.js';
import { PAPEIS } from '../config/constantes.js';
import * as usuarioRepositorio from '../repositorios/usuario.repositorio.js';
import { serializarAdmin, serializarUsuario } from '../serializadores/usuario.serializador.js';
import { ErroApp, naoAutenticado, proibido, requisicaoInvalida } from '../utilitarios/erros.js';
import { conferirSenha } from '../utilitarios/senha.js';
import { emitirSessao } from './autenticacao.servico.js';
import * as usuarioServico from './usuario.servico.js';

export async function obter(autenticado) {
  if (autenticado.papel === PAPEIS.ADM) return serializarAdmin({ nome: autenticado.nome, email: ambiente.admin.email });

  const usuario = await usuarioRepositorio.buscarPorId(autenticado.id);
  if (!usuario) throw naoAutenticado();
  return serializarUsuario(usuario);
}

/**
 * Edita o próprio perfil. Alterar e-mail ou senha exige a senha atual (defesa contra token roubado).
 * Trocar a senha invalida os tokens antigos, então devolvemos uma sessão nova para o usuário seguir logado.
 */
export async function atualizar(autenticado, dados) {
  if (autenticado.papel === PAPEIS.ADM) {
    throw proibido('As credenciais do administrador são definidas nas variáveis de ambiente do servidor.');
  }

  const atual = await usuarioRepositorio.buscarPorIdComSenha(autenticado.id);
  if (!atual) throw naoAutenticado();

  const trocaCredencial = dados.email !== atual.email || Boolean(dados.novaSenha);
  if (trocaCredencial) {
    if (!dados.senhaAtual) {
      throw requisicaoInvalida('Informe a senha atual para alterar o e-mail ou a senha.', [
        { campo: 'corpo.senhaAtual', mensagem: 'Obrigatória para alterar o e-mail ou a senha.' }
      ]);
    }
    if (!(await conferirSenha(dados.senhaAtual, atual.senhaHash))) {
      throw new ErroApp(403, 'SENHA_ATUAL_INCORRETA', 'Senha atual incorreta.');
    }
  }

  const { senhaHash, ...atualSemSenha } = atual;
  const atualizado = await usuarioServico.atualizar(atualSemSenha, dados);

  if (dados.novaSenha) return emitirSessao(atualizado);
  return { usuario: serializarUsuario(atualizado) };
}
