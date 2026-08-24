import { Banknote, CreditCard, Wallet, type LucideIcon } from 'lucide-react'
import { METODO_LABELS, type Metodo } from '@/lib/acciones'

export const METODOS_ICONOS: Record<Metodo, { label: string; Icon: LucideIcon }> = {
  debito: { label: METODO_LABELS.debito, Icon: CreditCard },
  efectivo: { label: METODO_LABELS.efectivo, Icon: Banknote },
  credito: { label: METODO_LABELS.credito, Icon: Wallet },
}
