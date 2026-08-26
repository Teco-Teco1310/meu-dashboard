'use client'
import { useState } from 'react'
import { useStore, Gasto, Categoria } from '@/lib/store'
import { formatBRL, CATEGORIAS } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { Plus, Trash2, CheckCircle, Circle } from 'lucide-react'

const CATS = Object.entries(CATEGORIAS) as [Categoria, { label: string; cor: string }][]

export default function Financas() {
  const { gastos, receitas, addGasto, removeGasto, togglePago } = useStore()
  const [catAtiva, setCatAtiva] = useState<Categoria>('contas_casa')
  const [form, setForm] = useState({ descricao: '', valor: '', vencimento: '', categoria: catAtiva as Categoria })
  const [mostraForm, setMostraForm] = useState(false)

  const totalReceitas = receitas.reduce((a, r) => a + r.valor, 0)
  const totalGastos = gastos.reduce((a, g) => a + g.valor, 0)
  const saldo = totalReceitas - totalGastos

  const gastosPorCat = (cat: Categoria) => gastos.filter((g) => g.categoria === cat)

  const salvar = () => {
    if (!form.descricao || !form.valor) return
    addGasto({
      descricao: form.descricao,
      valor: parseFloat(form.valor.replace(',', '.')),
      categoria: catAtiva,
      vencimento: form.vencimento || undefined,
      pago: false,
    })
    setForm({ descricao: '', valor: '', vencimento: '', categoria: catAtiva })
    setMostraForm(false)
  }

  return (
    <div className="p-4 space-y-5">
      {/* Resumo */}
      <div className="grid grid-cols-3 gap-3">
        <Card label="Receitas" valor={totalReceitas} cor="text-green-400" />
        <Card label="Gastos" valor={totalGastos} cor="text-red-400" />
        <Card label="Saldo" valor={saldo} cor={saldo >= 0 ? 'text-indigo-400' : 'text-red-400'} />
      </div>

      {/* Receitas */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Receitas</h2>
        </div>
        <div className="space-y-2">
          {receitas.map((r) => (
            <div key={r.id} className="flex items-center justify-between bg-slate-900 rounded-xl px-4 py-3 border border-slate-800">
              <span className="text-sm text-slate-200">{r.descricao}</span>
              <div className="text-right">
                <p className="text-sm font-semibold text-green-400">{formatBRL(r.valor)}</p>
                <p className="text-xs text-slate-500">dia {r.diaRecebimento}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categorias */}
      <section>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Gastos por categoria</h2>

        {/* Tabs de categoria */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-3 no-scrollbar">
          {CATS.map(([cat, { label }]) => (
            <button
              key={cat}
              onClick={() => { setCatAtiva(cat); setMostraForm(false) }}
              className={cn(
                'shrink-0 text-xs px-3 py-1.5 rounded-full border transition-colors',
                catAtiva === cat
                  ? CATEGORIAS[cat].cor
                  : 'border-slate-700 text-slate-500'
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Lista de gastos da categoria ativa */}
        <div className="space-y-2">
          {gastosPorCat(catAtiva).map((g) => (
            <GastoItem key={g.id} gasto={g} onToggle={togglePago} onRemove={removeGasto} />
          ))}
          {gastosPorCat(catAtiva).length === 0 && (
            <p className="text-xs text-slate-600 text-center py-4">
              Nenhum gasto em {CATEGORIAS[catAtiva].label.toLowerCase()}
            </p>
          )}
        </div>

        {/* Form de adição */}
        {mostraForm ? (
          <div className="mt-3 bg-slate-900 border border-slate-700 rounded-xl p-4 space-y-3">
            <input
              placeholder="Descrição"
              value={form.descricao}
              onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
              className="w-full bg-slate-800 text-sm text-slate-100 px-3 py-2 rounded-lg border border-slate-700 outline-none focus:border-indigo-500"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                placeholder="Valor (ex: 150,00)"
                value={form.valor}
                onChange={(e) => setForm((f) => ({ ...f, valor: e.target.value }))}
                inputMode="decimal"
                className="bg-slate-800 text-sm text-slate-100 px-3 py-2 rounded-lg border border-slate-700 outline-none focus:border-indigo-500"
              />
              <input
                placeholder="Vencimento (dia)"
                value={form.vencimento}
                onChange={(e) => setForm((f) => ({ ...f, vencimento: e.target.value }))}
                inputMode="numeric"
                maxLength={2}
                className="bg-slate-800 text-sm text-slate-100 px-3 py-2 rounded-lg border border-slate-700 outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={salvar} className="flex-1 bg-indigo-600 text-white text-sm py-2 rounded-lg font-medium">
                Salvar
              </button>
              <button onClick={() => setMostraForm(false)} className="flex-1 bg-slate-800 text-slate-300 text-sm py-2 rounded-lg">
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setMostraForm(true)}
            className="mt-3 w-full flex items-center justify-center gap-2 border border-dashed border-slate-700 text-slate-500 text-sm py-3 rounded-xl hover:border-indigo-500 hover:text-indigo-400 transition-colors"
          >
            <Plus size={16} />
            Adicionar em {CATEGORIAS[catAtiva].label}
          </button>
        )}
      </section>
    </div>
  )
}

function Card({ label, valor, cor }: { label: string; valor: number; cor: string }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className={cn('text-sm font-bold', cor)}>{formatBRL(valor)}</p>
    </div>
  )
}

function GastoItem({ gasto, onToggle, onRemove }: {
  gasto: Gasto
  onToggle: (id: string) => void
  onRemove: (id: string) => void
}) {
  return (
    <div className={cn(
      'flex items-center gap-3 bg-slate-900 rounded-xl px-4 py-3 border transition-colors',
      gasto.pago ? 'border-slate-800 opacity-50' : 'border-slate-800'
    )}>
      <button onClick={() => onToggle(gasto.id)} className="shrink-0">
        {gasto.pago
          ? <CheckCircle size={18} className="text-green-500" />
          : <Circle size={18} className="text-slate-600" />}
      </button>
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm', gasto.pago ? 'line-through text-slate-500' : 'text-slate-200')}>
          {gasto.descricao}
        </p>
        {gasto.vencimento && (
          <p className="text-xs text-slate-500">vence dia {gasto.vencimento}</p>
        )}
      </div>
      <p className="text-sm font-semibold text-slate-300 shrink-0">{formatBRL(gasto.valor)}</p>
      <button onClick={() => onRemove(gasto.id)} className="shrink-0 text-slate-700 hover:text-red-400 transition-colors">
        <Trash2 size={15} />
      </button>
    </div>
  )
}
