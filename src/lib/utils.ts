import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { Categoria } from './store'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatBRL(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export const CATEGORIAS: Record<Categoria, { label: string; cor: string }> = {
  contas_casa:  { label: 'Contas de casa',  cor: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  cartao:       { label: 'Cartão',          cor: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
  comida:       { label: 'Comida',          cor: 'bg-green-500/20 text-green-300 border-green-500/30' },
  outros:       { label: 'Outros',          cor: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' },
  dividas:      { label: 'Dívidas',         cor: 'bg-red-500/20 text-red-300 border-red-500/30' },
}

export const TIPO_TAREFA: Record<string, { label: string; cor: string; bg: string }> = {
  reuniao: { label: 'Reunião',  cor: 'text-blue-300',   bg: 'bg-blue-500/20 border-blue-500/40' },
  tarefa:  { label: 'Tarefa',   cor: 'text-green-300',  bg: 'bg-green-500/20 border-green-500/40' },
  prazo:   { label: 'Prazo',    cor: 'text-red-300',    bg: 'bg-red-500/20 border-red-500/40' },
}
