'use client'
import { useState, useEffect, useRef } from 'react'
import Financas from '@/components/Financas'
import Trabalho from '@/components/Trabalho'
import Login from '@/components/Login'
import { BarChart2, Briefcase, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { isAuthenticated, logout, getUsername } from '@/lib/auth'
import { useStore } from '@/lib/store'
import { fetchServerData, pushServerData } from '@/lib/sync'

type Modulo = 'financas' | 'trabalho'

export default function Home() {
  const [authed, setAuthed] = useState<boolean | null>(null)
  const [modulo, setModulo] = useState<Modulo>('financas')
  const [syncing, setSyncing] = useState(false)
  const { seeded, seedJaozincosta, gastos, receitas, tarefas, todos, notas, budgets } = useStore((s) => s)
  const store = useStore
  const pushTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const initialSyncDone = useRef(false)

  useEffect(() => {
    setAuthed(isAuthenticated())
  }, [])

  // Load from server on login
  useEffect(() => {
    if (!authed || initialSyncDone.current) return
    initialSyncDone.current = true

    setSyncing(true)
    fetchServerData().then((serverData) => {
      if (serverData && typeof serverData === 'object' && 'gastos' in serverData) {
        // Server has data → use it (overrides local)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        store.setState(serverData as any)
      } else if (getUsername() === 'jaozincosta' && !seeded) {
        // First time jaozincosta, no server data yet → seed defaults
        seedJaozincosta()
      }
      setSyncing(false)
    })
  }, [authed, seeded, seedJaozincosta])

  // Debounced push to server whenever data changes
  useEffect(() => {
    if (!authed || !initialSyncDone.current) return
    clearTimeout(pushTimer.current)
    pushTimer.current = setTimeout(() => {
      pushServerData({ gastos, receitas, tarefas, todos, notas, budgets, seeded })
    }, 1500)
    return () => clearTimeout(pushTimer.current)
  }, [authed, gastos, receitas, tarefas, todos, notas, budgets, seeded])

  if (authed === null) return null

  if (!authed) {
    return <Login onSuccess={() => window.location.reload()} />
  }

  function handleLogout() {
    logout()
    window.location.reload()
  }

  const username = getUsername()

  return (
    <div className="flex flex-col min-h-screen max-w-2xl mx-auto">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-950/95 backdrop-blur border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-sm font-semibold text-slate-400 tracking-widest uppercase">Dashboard</h1>
          {username && (
            <p className="text-[10px] mt-0.5 flex items-center gap-1">
              <span className="text-slate-600">@{username}</span>
              {syncing && <span className="text-indigo-500 animate-pulse">· sincronizando…</span>}
            </p>
          )}
        </div>
        <button onClick={handleLogout} className="text-slate-600 hover:text-slate-400 transition-colors" title="Sair">
          <LogOut size={16} />
        </button>
      </header>

      {/* Conteúdo */}
      <main className="flex-1 overflow-auto pb-24">
        {modulo === 'financas' ? <Financas /> : <Trabalho />}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur border-t border-slate-800">
        <div className="max-w-2xl mx-auto flex">
          {([
            { id: 'financas', label: 'Finanças',  Icon: BarChart2 },
            { id: 'trabalho', label: 'Trabalho',  Icon: Briefcase },
          ] as const).map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setModulo(id)}
              className={cn(
                'flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors',
                modulo === id ? 'text-indigo-400' : 'text-slate-500'
              )}
            >
              <Icon size={20} />
              {label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
