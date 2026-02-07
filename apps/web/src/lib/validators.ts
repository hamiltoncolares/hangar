export function isMonth(value: string) {
  return /^\d{4}-\d{2}$/.test(value);
}

export function isDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}
