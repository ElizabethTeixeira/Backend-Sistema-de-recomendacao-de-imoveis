/** Normalização, validação e formatação de CPF e telefone (armazenados só com dígitos). */

export const apenasDigitos = (valor) => String(valor ?? '').replace(/\D/g, '');

export function cpfValido(valor) {
  const cpf = apenasDigitos(valor);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

  const calcularDigito = (quantidade) => {
    let soma = 0;
    for (let i = 0; i < quantidade; i += 1) soma += Number(cpf[i]) * (quantidade + 1 - i);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };

  return calcularDigito(9) === Number(cpf[9]) && calcularDigito(10) === Number(cpf[10]);
}

export function telefoneValido(valor) {
  const digitos = apenasDigitos(valor);
  if (digitos.length !== 10 && digitos.length !== 11) return false;
  if (digitos[0] === '0' || digitos[1] === '0') return false; // DDD inválido
  return digitos.length === 10 || digitos[2] === '9'; // celular tem o 9 na frente
}

export function formatarCpf(digitos) {
  const d = apenasDigitos(digitos);
  return d.length === 11 ? `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}` : d;
}

export function formatarTelefone(digitos) {
  const d = apenasDigitos(digitos);
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return d;
}
