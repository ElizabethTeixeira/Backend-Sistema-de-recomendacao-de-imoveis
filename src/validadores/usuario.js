import { z } from 'zod';
import { cpfEsquema, creciEsquema, dataNascimentoEsquema, emailEsquema, fotoPerfilEsquema, idEsquema, nomeEsquema, paginacaoEsquema, senhaAtualEsquema, senhaNovaEsquema, telefoneEsquema, textoDeConsulta } from './comuns.js';

const camposComuns = {
  nome: nomeEsquema,
  telefone: telefoneEsquema,
  cpf: cpfEsquema,
  dataNascimento: dataNascimentoEsquema,
  email: emailEsquema
};

const camposCorretor = { creci: creciEsquema, foto: fotoPerfilEsquema };

// ---- Perfil do próprio usuário (PUT /perfil) ----
// Trocar e-mail ou senha exige `senhaAtual`: um token roubado sozinho não basta para tomar a conta.
export const esquemaPerfilCliente = z
  .object({ ...camposComuns, senhaAtual: senhaAtualEsquema.optional(), novaSenha: senhaNovaEsquema.optional() })
  .strict();

export const esquemaPerfilCorretor = z
  .object({ ...camposComuns, ...camposCorretor, senhaAtual: senhaAtualEsquema.optional(), novaSenha: senhaNovaEsquema.optional() })
  .strict();

// ---- CRUD do administrador (/admin/clientes e /admin/corretores) ----
export const esquemaAdminCriarCliente = z.object({ ...camposComuns, senha: senhaNovaEsquema }).strict();
export const esquemaAdminCriarCorretor = z.object({ ...camposComuns, ...camposCorretor, senha: senhaNovaEsquema }).strict();
// Na edição a senha é opcional: em branco mantém a atual (mesmo comportamento da tela do admin).
export const esquemaAdminAtualizarCliente = z.object({ ...camposComuns, senha: senhaNovaEsquema.optional() }).strict();
export const esquemaAdminAtualizarCorretor = z
  .object({ ...camposComuns, ...camposCorretor, senha: senhaNovaEsquema.optional() })
  .strict();

export const parametrosIdEsquema = z.object({ id: idEsquema }).strict();

export const consultaListagemAdminEsquema = z
  .object({ busca: textoDeConsulta(100), ...paginacaoEsquema(20, 100) })
  .strict();
