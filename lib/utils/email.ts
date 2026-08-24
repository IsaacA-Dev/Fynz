export function esEmailValido(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())
}

export function normalizarEmail(email: string): string {
  return email.trim().toLowerCase()
}
