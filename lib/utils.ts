export function esEmailValido(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())
}

export function normalizarEmail(email: string): string {
  return email.trim().toLowerCase()
}

interface AuthError {
  code?: string
  message?: string
}

const ERROR_MESSAGES: Record<string, string> = {
  invalid_credentials: 'Correo o contraseña incorrectos',
  email_not_confirmed: 'Confirma tu correo antes de iniciar sesión',
  user_already_exists: 'Este correo ya está registrado',
  weak_password: 'La contraseña debe tener al menos 6 caracteres',
  over_request_rate_limit: 'Demasiados intentos, espera un momento',
  email_exists: 'Ese correo ya está en uso',
}

export function traducirErrorAuth(error: AuthError | null): string {
  if (!error) return ''
  return ERROR_MESSAGES[error.code ?? ''] ?? 'Ocurrió un error, intenta de nuevo'
}
