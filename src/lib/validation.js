const MAX_PG_INT = 2147483647;

export function parsePositiveInt(value) {
  if (typeof value === "number") {
    if (Number.isInteger(value) && value > 0 && value <= MAX_PG_INT) {
      return value;
    }
    return null;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!/^\d+$/.test(trimmed)) return null;
    const num = Number(trimmed);
    if (Number.isInteger(num) && num > 0 && num <= MAX_PG_INT) {
      return num;
    }
  }
  return null;
}

export function isValidEmail(email) {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidDateString(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}
