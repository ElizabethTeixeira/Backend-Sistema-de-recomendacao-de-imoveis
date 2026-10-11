/** Minúsculas e sem acentos: "Chácara" e "chacara" passam a ser comparáveis. */
export function normalizarTexto(texto) {
  return String(texto ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

/** Aparar e colapsar espaços internos repetidos. */
export function limparEspacos(texto) {
  return String(texto ?? '').trim().replace(/\s+/g, ' ');
}
