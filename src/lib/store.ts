import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ─── Tipos ───────────────────────────────────────────────────────────────────

export type Categoria = 'contas_casa' | 'cartao' | 'comida' | 'outros' | 'dividas'

export interface Gasto {
  id: string
  descricao: string
  valor: number
  categoria: Categoria
  vencimento?: string
  pago: boolean
}

export interface Receita {
  id: string
  descricao: string
  valor: number
  diaRecebimento: number
}

export interface Tarefa {
  id: string
  titulo: string
  descricao?: string
  data: string
  hora?: string
  tipo: 'reuniao' | 'tarefa' | 'prazo'
  concluida: boolean
}

export interface Todo {
  id: string
  titulo: string
  concluida: boolean
  prioridade: 'alta' | 'media' | 'baixa'
  criadoEm: string
}

export interface Nota {
  id: string
  titulo: string
  conteudo: string
  categoria: 'estudos' | 'geral'
  tags: string[]
  atualizadaEm: string
}

// ─── Estado ──────────────────────────────────────────────────────────────────

interface AppState {
  gastos: Gasto[]
  receitas: Receita[]
  tarefas: Tarefa[]
  todos: Todo[]
  notas: Nota[]

  addGasto: (g: Omit<Gasto, 'id'>) => void
  updateGasto: (id: string, g: Partial<Gasto>) => void
  removeGasto: (id: string) => void
  togglePago: (id: string) => void

  addReceita: (r: Omit<Receita, 'id'>) => void
  updateReceita: (id: string, r: Partial<Receita>) => void
  removeReceita: (id: string) => void

  addTarefa: (t: Omit<Tarefa, 'id'>) => void
  updateTarefa: (id: string, t: Partial<Tarefa>) => void
  removeTarefa: (id: string) => void
  toggleConcluida: (id: string) => void

  addTodo: (t: Omit<Todo, 'id' | 'criadoEm'>) => void
  updateTodo: (id: string, t: Partial<Todo>) => void
  removeTodo: (id: string) => void
  toggleTodo: (id: string) => void

  addNota: (n: Omit<Nota, 'id' | 'atualizadaEm'>) => void
  updateNota: (id: string, n: Partial<Nota>) => void
  removeNota: (id: string) => void
}

// ─── Store ───────────────────────────────────────────────────────────────────

const uid = () => Math.random().toString(36).slice(2, 9)
const now = () => new Date().toISOString()

export const useStore = create<AppState>()(
  persist(
    (set) => ({
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
      todos: [],
      notas: [],

      addGasto: (g) => set((s) => ({ gastos: [...s.gastos, { ...g, id: uid() }] })),
      updateGasto: (id, g) => set((s) => ({ gastos: s.gastos.map((x) => x.id === id ? { ...x, ...g } : x) })),
      removeGasto: (id) => set((s) => ({ gastos: s.gastos.filter((x) => x.id !== id) })),
      togglePago: (id) => set((s) => ({ gastos: s.gastos.map((x) => x.id === id ? { ...x, pago: !x.pago } : x) })),

      addReceita: (r) => set((s) => ({ receitas: [...s.receitas, { ...r, id: uid() }] })),
      updateReceita: (id, r) => set((s) => ({ receitas: s.receitas.map((x) => x.id === id ? { ...x, ...r } : x) })),
      removeReceita: (id) => set((s) => ({ receitas: s.receitas.filter((x) => x.id !== id) })),

      addTarefa: (t) => set((s) => ({ tarefas: [...s.tarefas, { ...t, id: uid() }] })),
      updateTarefa: (id, t) => set((s) => ({ tarefas: s.tarefas.map((x) => x.id === id ? { ...x, ...t } : x) })),
      removeTarefa: (id) => set((s) => ({ tarefas: s.tarefas.filter((x) => x.id !== id) })),
      toggleConcluida: (id) => set((s) => ({ tarefas: s.tarefas.map((x) => x.id === id ? { ...x, concluida: !x.concluida } : x) })),

      addTodo: (t) => set((s) => ({ todos: [...s.todos, { ...t, id: uid(), criadoEm: now() }] })),
      updateTodo: (id, t) => set((s) => ({ todos: s.todos.map((x) => x.id === id ? { ...x, ...t } : x) })),
      removeTodo: (id) => set((s) => ({ todos: s.todos.filter((x) => x.id !== id) })),
      toggleTodo: (id) => set((s) => ({ todos: s.todos.map((x) => x.id === id ? { ...x, concluida: !x.concluida } : x) })),

      addNota: (n) => set((s) => ({ notas: [...s.notas, { ...n, id: uid(), atualizadaEm: now() }] })),
      updateNota: (id, n) => set((s) => ({ notas: s.notas.map((x) => x.id === id ? { ...x, ...n, atualizadaEm: now() } : x) })),
      removeNota: (id) => set((s) => ({ notas: s.notas.filter((x) => x.id !== id) })),
    }),
    { name: 'dashboard-data-v1' }
  )
)
