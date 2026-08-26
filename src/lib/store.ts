import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ─── Tipos ───────────────────────────────────────────────────────────────────

export type Categoria =
  | 'contas_casa'
  | 'cartao'
  | 'comida'
  | 'outros'
  | 'dividas'

export interface Gasto {
  id: string
  descricao: string
  valor: number
  categoria: Categoria
  vencimento?: string // DD/MM
  pago: boolean
  fonte?: string // de qual renda sai
}

export interface Receita {
  id: string
  descricao: string
  valor: number
  diaRecebimento: number // dia do mês
}

export interface Tarefa {
  id: string
  titulo: string
  descricao?: string
  data: string // YYYY-MM-DD
  hora?: string // HH:MM
  tipo: 'reuniao' | 'tarefa' | 'prazo'
  concluida: boolean
  cor?: string
}

// ─── Estado ──────────────────────────────────────────────────────────────────

interface AppState {
  gastos: Gasto[]
  receitas: Receita[]
  tarefas: Tarefa[]

  // Ações — Gastos
  addGasto: (g: Omit<Gasto, 'id'>) => void
  updateGasto: (id: string, g: Partial<Gasto>) => void
  removeGasto: (id: string) => void
  togglePago: (id: string) => void

  // Ações — Receitas
  addReceita: (r: Omit<Receita, 'id'>) => void
  removeReceita: (id: string) => void

  // Ações — Tarefas
  addTarefa: (t: Omit<Tarefa, 'id'>) => void
  updateTarefa: (id: string, t: Partial<Tarefa>) => void
  removeTarefa: (id: string) => void
  toggleConcluida: (id: string) => void
}

// ─── Store ───────────────────────────────────────────────────────────────────

const uid = () => Math.random().toString(36).slice(2, 9)

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      // ── Dados iniciais pré-carregados ──────────────────────────────────────
      receitas: [
        { id: uid(), descricao: 'Adiantamento CLT', valor: 1620, diaRecebimento: 15 },
        { id: uid(), descricao: 'Salário CLT', valor: 8800, diaRecebimento: 30 },
        { id: uid(), descricao: 'PJ', valor: 4200, diaRecebimento: 5 },
      ],

      gastos: [
        { id: uid(), descricao: 'Condomínio', valor: 925, categoria: 'contas_casa', vencimento: '05', pago: false },
        { id: uid(), descricao: 'IPTU Apartamento', valor: 232, categoria: 'contas_casa', vencimento: '09', pago: false },
        { id: uid(), descricao: 'IPTU Garagens', valor: 50, categoria: 'contas_casa', vencimento: '14', pago: false },
        { id: uid(), descricao: 'Internet', valor: 118.45, categoria: 'contas_casa', vencimento: '10', pago: false },
        { id: uid(), descricao: 'Enel', valor: 150, categoria: 'contas_casa', vencimento: '25', pago: false },
        { id: uid(), descricao: 'Gás', valor: 60, categoria: 'contas_casa', vencimento: '08', pago: false },
        { id: uid(), descricao: 'DAS (MEI)', valor: 81, categoria: 'contas_casa', vencimento: '20', pago: false },
        { id: uid(), descricao: 'Rose', valor: 115, categoria: 'contas_casa', pago: false },
        { id: uid(), descricao: 'Inglês', valor: 400, categoria: 'contas_casa', pago: false },
      ],

      tarefas: [],

      // ── Gastos ────────────────────────────────────────────────────────────
      addGasto: (g) => set((s) => ({ gastos: [...s.gastos, { ...g, id: uid() }] })),
      updateGasto: (id, g) =>
        set((s) => ({ gastos: s.gastos.map((x) => (x.id === id ? { ...x, ...g } : x)) })),
      removeGasto: (id) => set((s) => ({ gastos: s.gastos.filter((x) => x.id !== id) })),
      togglePago: (id) =>
        set((s) => ({ gastos: s.gastos.map((x) => (x.id === id ? { ...x, pago: !x.pago } : x)) })),

      // ── Receitas ──────────────────────────────────────────────────────────
      addReceita: (r) => set((s) => ({ receitas: [...s.receitas, { ...r, id: uid() }] })),
      removeReceita: (id) => set((s) => ({ receitas: s.receitas.filter((x) => x.id !== id) })),

      // ── Tarefas ───────────────────────────────────────────────────────────
      addTarefa: (t) => set((s) => ({ tarefas: [...s.tarefas, { ...t, id: uid() }] })),
      updateTarefa: (id, t) =>
        set((s) => ({ tarefas: s.tarefas.map((x) => (x.id === id ? { ...x, ...t } : x)) })),
      removeTarefa: (id) => set((s) => ({ tarefas: s.tarefas.filter((x) => x.id !== id) })),
      toggleConcluida: (id) =>
        set((s) => ({
          tarefas: s.tarefas.map((x) => (x.id === id ? { ...x, concluida: !x.concluida } : x)),
        })),
    }),
    {
      name: 'dashboard-data-v1',
    }
  )
)
