export function mascararDinheiro(texto: string) {
  const digitos = texto.replace(/\D/g, "").slice(0, 11);
  if (!digitos) return "";
  return (Number(digitos) / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
