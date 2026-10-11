import { z } from 'zod';
import { PAPEIS } from '../config/constantes.js';
import { cpfEsquema, creciEsquema, dataNascimentoEsquema, emailEsquema, fotoPerfilEsquema, nomeEsquema, senhaNovaEsquema, telefoneEsquema } from './comuns.js';

const camposComuns = {
  nome: nomeEsquema,
  telefone: telefoneEsquema,
  cpf: cpfEsquema,
  dataNascimento: dataNascimentoEsquema,
  email: emailEsquema
};

export const esquemaCadastroCliente = z.object({ ...camposComuns, senha: senhaNovaEsquema }).strict();

export const esquemaCadastroCorretor = z
  .object({ ...camposComuns, creci: creciEsquema, foto: fotoPerfilEsquema, senha: senhaNovaEsquema })
  .strict();

// No login a senha não passa pela regra de força: apenas limitamos o tamanho para não processar lixo.
export const esquemaEntrar = z
  .object({
    papel: z.enum([PAPEIS.CLIENTE, PAPEIS.CORRETOR, PAPEIS.ADM]),
    email: z.string().trim().toLowerCase().min(1).max(254),
    senha: z.string().min(1).max(128)
  })
  .strict();
