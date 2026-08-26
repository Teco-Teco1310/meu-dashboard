'use client'
import { useState, useEffect } from 'react'
import Financas from '@/components/Financas'
import Trabalho from '@/components/Trabalho'
import Login from '@/components/Login'
import { BarChart2, Briefcase, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { isAuthenticated, logout } from '@/lib/auth'

type Modulo = 'financas' | 'trabalho'

export default function Home() {
  const [authed, setAuthed] = useState<boolean | null>(null)
  const [modulo, setModulo] = useState<Modulo>('financas')

  useEffect(() => {
    setAuthed(isAuthenticated())
  }, [])

  if (authed === null) return null

  if (!authed) {
    return <Login onSuccess={() => setAuthed(true)} />
  }

  function handleLogout() {
    logout()
    setAuthed(false)
  }

  return (
    <div className="flex flex-col min-h-screen max-w-2xl mx-auto">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-950/95 backdrop-blur border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <h1 className="text-sm font-semibold text-slate-400 tracking-widest uppercase">
          Dashboard
        </h1>
        <button
          onClick={handleLogout}
          className="text-slate-600 hover:text-slate-400 transition-colors"
          title="Sair"
        >
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
