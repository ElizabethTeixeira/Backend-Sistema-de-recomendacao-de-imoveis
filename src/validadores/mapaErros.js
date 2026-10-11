import { z } from 'zod';

/** Mensagens de validação do zod em português (sobrescritas por mensagens específicas quando existem). */
const mapaErros = (issue, ctx) => {
  switch (issue.code) {
    case z.ZodIssueCode.invalid_type:
      if (issue.received === 'undefined') return { message: 'Campo obrigatório.' };
      return { message: `Tipo inválido: esperado ${traduzirTipo(issue.expected)}.` };
    case z.ZodIssueCode.too_small:
      if (issue.type === 'string') {
        return { message: issue.minimum === 1 ? 'Campo obrigatório.' : `Informe ao menos ${issue.minimum} caractere(s).` };
      }
      if (issue.type === 'array') return { message: `Informe ao menos ${issue.minimum} item(ns).` };
      return { message: `O valor mínimo é ${issue.minimum}.` };
    case z.ZodIssueCode.too_big:
      if (issue.type === 'string') return { message: `Use no máximo ${issue.maximum} caractere(s).` };
      if (issue.type === 'array') return { message: `Informe no máximo ${issue.maximum} item(ns).` };
      return { message: `O valor máximo é ${issue.maximum}.` };
    case z.ZodIssueCode.invalid_enum_value:
      return { message: `Valor inválido. Opções: ${issue.options.join(', ')}.` };
    case z.ZodIssueCode.unrecognized_keys:
      return { message: `Campo(s) não permitido(s): ${issue.keys.join(', ')}.` };
    case z.ZodIssueCode.invalid_string:
      if (issue.validation === 'email') return { message: 'E-mail inválido.' };
      if (issue.validation === 'uuid') return { message: 'Identificador inválido.' };
      return { message: 'Formato inválido.' };
    default:
      return { message: ctx.defaultError };
  }
};

function traduzirTipo(tipo) {
  const nomes = { string: 'texto', number: 'número', integer: 'inteiro', boolean: 'verdadeiro/falso', object: 'objeto', array: 'lista' };
  return nomes[tipo] ?? tipo;
}

z.setErrorMap(mapaErros);
