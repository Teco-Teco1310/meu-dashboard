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

type SyncState = 'loading' | 'ok' | 'error'

export default function Home() {
  const [authed, setAuthed] = useState<boolean | null>(null)
  const [modulo, setModulo] = useState<Modulo>('financas')
  const [syncState, setSyncState] = useState<SyncState>('loading')
  const [syncAttempt, setSyncAttempt] = useState(0)
  const { seeded, gastos, receitas, tarefas, todos, notas, budgets } = useStore((s) => s)
  const pushTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const lastSynced = useRef<string>('')

  useEffect(() => {
    setAuthed(isAuthenticated())
  }, [])

  // Load from server on login. Nothing is pushed until this succeeds, so a
  // slow or failed load can never overwrite the server with local (maybe empty) data.
  useEffect(() => {
    if (!authed) return
    let cancelled = false
    fetchServerData().then((result) => {
      if (cancelled) return
      if (!result.ok) {
        if (result.unauthorized) {
          logout()
          window.location.reload()
          return
        }
        setSyncState('error')
        return
      }
      const serverData = result.data
      if (serverData && Array.isArray(serverData.gastos)) {
        // Server has data → it wins over local
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        useStore.setState(serverData as any)
        const s = useStore.getState()
        lastSynced.current = JSON.stringify({
          gastos: s.gastos, receitas: s.receitas, tarefas: s.tarefas,
          todos: s.todos, notas: s.notas, budgets: s.budgets, seeded: s.seeded,
        })
      } else if (getUsername() === 'jaozincosta' && !useStore.getState().seeded) {
        // First time jaozincosta, no server data yet → seed defaults
        useStore.getState().seedJaozincosta()
      }
      setSyncState('ok')
    })
    return () => { cancelled = true }
  }, [authed, syncAttempt])

  // Debounced push to server whenever data changes (only after a successful load)
  useEffect(() => {
    if (!authed || syncState !== 'ok') return
    const payload = { gastos, receitas, tarefas, todos, notas, budgets, seeded }
    const json = JSON.stringify(payload)
    if (json === lastSynced.current) return
    clearTimeout(pushTimer.current)
    pushTimer.current = setTimeout(() => {
      pushServerData(payload).then((ok) => {
        if (ok) lastSynced.current = json
      })
    }, 1500)
    return () => clearTimeout(pushTimer.current)
  }, [authed, syncState, gastos, receitas, tarefas, todos, notas, budgets, seeded])

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
              {syncState === 'loading' && <span className="text-indigo-500 animate-pulse">· sincronizando…</span>}
            </p>
          )}
        </div>
        <button onClick={handleLogout} className="text-slate-600 hover:text-slate-400 transition-colors" title="Sair">
          <LogOut size={16} />
        </button>
      </header>

      {syncState === 'error' && (
        <div role="alert" className="mx-4 mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300 flex items-center justify-between gap-3">
          <span>Não foi possível sincronizar com o servidor. Alterações feitas agora ficam só neste aparelho.</span>
          <button onClick={() => { setSyncState('loading'); setSyncAttempt((n) => n + 1) }} className="shrink-0 font-semibold text-amber-200 hover:text-white">
            Tentar de novo
          </button>
        </div>
      )}

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
