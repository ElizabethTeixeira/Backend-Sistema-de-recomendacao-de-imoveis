import { z } from 'zod';
import { LIMITES } from '../config/constantes.js';
import { idEsquema, paginacaoEsquema, semNulo } from './comuns.js';

export const esquemaMensagem = z
  .object({
    texto: z
      .string()
      .trim()
      .min(1, 'Escreva uma mensagem.')
      .max(LIMITES.maxCaracteresMensagem)
      .refine(semNulo, 'Texto contém caracteres inválidos.')
  })
  .strict();

export const parametrosConversaEsquema = z.object({ id: idEsquema }).strict();
export const parametrosImovelMensagemEsquema = z.object({ id: idEsquema }).strict();

export const consultaConversasEsquema = z.object({ ...paginacaoEsquema(20, 50) }).strict();
