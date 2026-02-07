export function parseMonth(value: string): Date {
  if (!value) throw new Error('mes_ref is required');
  const v = value.trim();
  if (/^\d{4}-\d{2}$/.test(v)) return new Date(`${v}-01T00:00:00.000Z`);
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return new Date(`${v}T00:00:00.000Z`);
  throw new Error('mes_ref must be YYYY-MM or YYYY-MM-DD');
}

export function calcReceitaLiquida(receitaBruta: number, percentual: number) {
  const imposto = receitaBruta * (percentual / 100);
  const liquida = receitaBruta - imposto;
  return Number(liquida.toFixed(2));
}

export function toNumber(value: unknown, field: string) {
  const n = Number(value);
  if (Number.isNaN(n)) throw new Error(`${field} must be a number`);
  return n;
}
