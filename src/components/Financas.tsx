'use client'
import { useState, useMemo, useRef, useEffect } from 'react'
import { useStore, Gasto, Receita, Categoria, Budget } from '@/lib/store'
import { formatBRL, CATEGORIAS } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { Plus, Trash2, CheckCircle, Circle, Pencil, Check, X, FileText, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react'
import { format, addMonths, startOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const CATS = Object.entries(CATEGORIAS) as [Categoria, { label: string; cor: string }][]

// Gera janela de meses: 3 antes + atual + 12 à frente
function getMeses() {
  const hoje = startOfMonth(new Date())
  return Array.from({ length: 16 }, (_, i) => {
    const d = addMonths(hoje, i - 3)
    return {
      key: format(d, 'yyyy-MM'),
      label: format(d, 'MMM', { locale: ptBR }),
      ano: format(d, 'yy'),
    }
  })
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function Financas() {
  const { gastos, receitas, addGasto, removeGasto, togglePago, updateGasto, updateReceita, addReceita, removeReceita, budgets, setBudget, removeBudget } = useStore()
  const mesAtualKey = format(new Date(), 'yyyy-MM')
  const [mesAtivo, setMesAtivo] = useState(mesAtualKey)
  const [catAtiva, setCatAtiva] = useState<Categoria>('contas_casa')
  const [form, setForm] = useState({ descricao: '', valor: '', vencimento: '', recorrente: true })
  const [mostraForm, setMostraForm] = useState(false)
  const [mostraRelatorio, setMostraRelatorio] = useState(false)
  const [abaRelatorio, setAbaRelatorio] = useState<'mensal' | 'anual'>('mensal')
  const [mesRelatorio, setMesRelatorio] = useState(new Date().getMonth())
  const [anoRelatorio, setAnoRelatorio] = useState(new Date().getFullYear())
  const meses = useMemo(getMeses, [])
  const mesNavRef = useRef<HTMLDivElement>(null)

  // Auto-scroll para mês ativo na nav
  useEffect(() => {
    const el = mesNavRef.current
    if (!el) return
    const btn = el.querySelector(`[data-mes="${mesAtivo}"]`) as HTMLElement
    if (btn) btn.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' })
  }, [mesAtivo])

  // Valor efetivo de um gasto/receita no mês ativo (usa override se existir)
  const getValorGasto = (g: Gasto) => g.valorMeses?.[mesAtivo] ?? g.valor
  const getValorReceita = (r: Receita) => r.valorMeses?.[mesAtivo] ?? r.valor

  // Gastos visíveis no mês ativo
  const gastosVisiveis = gastos.filter((g) => g.recorrente || g.mes === mesAtivo)
  const gastosPorCat = (cat: Categoria) => gastosVisiveis.filter((g) => g.categoria === cat)
  const totalCat = (cat: Categoria) => gastosPorCat(cat).reduce((a, g) => a + getValorGasto(g), 0)
  const totalGastos = gastosVisiveis.reduce((a, g) => a + getValorGasto(g), 0)

  // Receitas visíveis no mês ativo
  const receitasVisiveis = receitas.filter((r) => (r.recorrente ?? true) || r.mes === mesAtivo)
  const totalReceitas = receitasVisiveis.reduce((a, r) => a + getValorReceita(r), 0)
  const saldo = totalReceitas - totalGastos

  const isPago = (g: Gasto) => g.recorrente ? (g.pagoMeses[mesAtivo] ?? false) : g.pago
  const handleTogglePago = (id: string) => togglePago(id, mesAtivo)

  // Form: recorrente default true para contas_casa, false para outros
  useEffect(() => {
    setForm((f) => ({ ...f, recorrente: catAtiva === 'contas_casa' }))
  }, [catAtiva])

  const salvar = () => {
    if (!form.descricao || !form.valor) return
    addGasto({
      descricao: form.descricao,
      valor: parseFloat(form.valor.replace(',', '.')),
      valorMeses: {},
      categoria: catAtiva,
      vencimento: form.vencimento || undefined,
      recorrente: form.recorrente,
      mes: form.recorrente ? undefined : mesAtivo,
      pagoMeses: {},
      pago: false,
    })
    setForm((f) => ({ descricao: '', valor: '', vencimento: '', recorrente: f.recorrente }))
    setMostraForm(false)
  }

  return (
    <div className="p-4 space-y-5">
      {/* Navegação de meses */}
      <div ref={mesNavRef} className="flex gap-2 overflow-x-auto pb-1 no-scrollbar -mx-4 px-4">
        {meses.map(({ key, label, ano }) => (
          <button
            key={key}
            data-mes={key}
            onClick={() => setMesAtivo(key)}
            className={cn(
              'shrink-0 flex flex-col items-center px-3 py-2 rounded-xl border text-xs transition-colors',
              mesAtivo === key
                ? 'bg-indigo-600 border-indigo-500 text-white'
                : key === mesAtualKey
                ? 'border-indigo-500/40 text-indigo-400'
                : 'border-slate-800 text-slate-500'
            )}
          >
            <span className="font-semibold capitalize">{label}</span>
            <span className="text-[10px] opacity-60">{ano}</span>
          </button>
        ))}
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-3 gap-3">
        <SummaryCard label="Receitas" valor={totalReceitas} cor="text-green-400" />
        <SummaryCard label="Gastos"   valor={totalGastos}   cor="text-red-400" />
        <SummaryCard label="Saldo"    valor={saldo}         cor={saldo >= 0 ? 'text-indigo-400' : 'text-red-400'} />
      </div>

      {/* Botão relatório */}
      <button
        onClick={() => setMostraRelatorio(true)}
        className="w-full flex items-center justify-center gap-2 bg-slate-900 border border-slate-800 text-slate-400 text-sm py-2.5 rounded-xl hover:border-indigo-500 hover:text-indigo-400 transition-colors"
      >
        <FileText size={15} /> Emitir Relatório
      </button>

      {/* Receitas */}
      <section>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Receitas</h2>
        <div className="space-y-2">
          {receitasVisiveis.map((r) => (
            <ReceitaItem key={r.id} receita={r} mesAtivo={mesAtivo} onUpdate={updateReceita} onRemove={removeReceita} />
          ))}
          <AddReceita onAdd={addReceita} mesAtivo={mesAtivo} meses={meses} />
        </div>
      </section>

      {/* Gastos por categoria */}
      <section>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Gastos por categoria</h2>

        <div className="flex gap-2 overflow-x-auto pb-2 mb-3 no-scrollbar">
          {CATS.map(([cat, { label }]) => (
            <button
              key={cat}
              onClick={() => { setCatAtiva(cat); setMostraForm(false) }}
              className={cn(
                'shrink-0 text-xs px-3 py-1.5 rounded-full border transition-colors',
                catAtiva === cat ? CATEGORIAS[cat].cor : 'border-slate-700 text-slate-500'
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          {gastosPorCat(catAtiva).map((g) => (
            <GastoItem key={g.id} gasto={g} mesAtivo={mesAtivo} isPago={isPago(g)} onToggle={handleTogglePago} onRemove={removeGasto} onUpdate={updateGasto} />
          ))}
          {gastosPorCat(catAtiva).length === 0 && (
            <p className="text-xs text-slate-600 text-center py-4">
              {catAtiva === 'contas_casa'
                ? 'Nenhum gasto recorrente nesta categoria'
                : `Nenhum gasto em ${CATEGORIAS[catAtiva].label.toLowerCase()} em ${meses.find(m => m.key === mesAtivo)?.label ?? mesAtivo}`}
            </p>
          )}
        </div>

        {gastosPorCat(catAtiva).length > 0 && (
          <div className="flex justify-between items-center px-1 pt-3 border-t border-slate-800 mt-2">
            <span className="text-xs text-slate-500">Total {CATEGORIAS[catAtiva].label}</span>
            <span className="text-sm font-bold text-slate-200">{formatBRL(totalCat(catAtiva))}</span>
          </div>
        )}

        {mostraForm ? (
          <div className="mt-3 bg-slate-900 border border-slate-700 rounded-xl p-4 space-y-3">
            <input placeholder="Descrição" value={form.descricao}
              onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
              className="w-full bg-slate-800 text-sm text-slate-100 px-3 py-2 rounded-lg border border-slate-700 outline-none focus:border-indigo-500" />
            <div className="grid grid-cols-2 gap-2">
              <input placeholder="Valor" value={form.valor} inputMode="decimal"
                onChange={(e) => setForm((f) => ({ ...f, valor: e.target.value }))}
                className="bg-slate-800 text-sm text-slate-100 px-3 py-2 rounded-lg border border-slate-700 outline-none focus:border-indigo-500" />
              <input placeholder="Vencimento (dia)" value={form.vencimento} inputMode="numeric" maxLength={2}
                onChange={(e) => setForm((f) => ({ ...f, vencimento: e.target.value }))}
                className="bg-slate-800 text-sm text-slate-100 px-3 py-2 rounded-lg border border-slate-700 outline-none focus:border-indigo-500" />
            </div>
            <button
              onClick={() => setForm((f) => ({ ...f, recorrente: !f.recorrente }))}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-xs transition-colors',
                form.recorrente
                  ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                  : 'border-slate-700 text-slate-500'
              )}
            >
              <RefreshCw size={12} />
              {form.recorrente ? 'Recorrente — aparece em todos os meses' : 'Único — apenas em ' + (meses.find(m => m.key === mesAtivo)?.label ?? mesAtivo)}
            </button>
            <div className="flex gap-2">
              <button onClick={salvar} className="flex-1 bg-indigo-600 text-white text-sm py-2 rounded-lg font-medium">Salvar</button>
              <button onClick={() => setMostraForm(false)} className="flex-1 bg-slate-800 text-slate-300 text-sm py-2 rounded-lg">Cancelar</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setMostraForm(true)}
            className="mt-3 w-full flex items-center justify-center gap-2 border border-dashed border-slate-700 text-slate-500 text-sm py-3 rounded-xl hover:border-indigo-500 hover:text-indigo-400 transition-colors">
            <Plus size={16} /> Adicionar em {CATEGORIAS[catAtiva].label}
          </button>
        )}
      </section>

      {/* Resumo por categoria */}
      <section>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Resumo por categoria</h2>
        <div className="space-y-2">
          {CATS.map(([cat, { label, cor }]) => {
            const total = totalCat(cat)
            const pctDoTotal = totalGastos > 0 ? (total / totalGastos) * 100 : 0
            const budget = budgets[cat]
            const budgetValor = budget
              ? budget.tipo === 'percentual' ? (totalReceitas * budget.valor) / 100 : budget.valor
              : null
            const pctBudget = budgetValor && budgetValor > 0 ? Math.min((total / budgetValor) * 100, 100) : null
            const overBudget = budgetValor !== null && total > budgetValor
            const nearBudget = pctBudget !== null && pctBudget >= 75 && !overBudget
            const barColor = overBudget ? 'bg-red-500' : nearBudget ? 'bg-amber-500' : 'bg-indigo-500'
            return (
              <CategoryBudgetCard
                key={cat}
                cat={cat}
                label={label}
                cor={cor}
                total={total}
                pctDoTotal={pctDoTotal}
                budget={budget}
                budgetValor={budgetValor}
                pctBudget={pctBudget}
                overBudget={overBudget}
                nearBudget={nearBudget}
                barColor={barColor}
                totalReceitas={totalReceitas}
                onSetBudget={(b) => setBudget(cat, b)}
                onRemoveBudget={() => removeBudget(cat)}
              />
            )
          })}
        </div>

        {/* Total geral */}
        <div className="mt-3 flex items-center justify-between bg-slate-800 border border-slate-700 rounded-xl px-4 py-4">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Total de gastos</p>
            <p className="text-xs text-slate-500 mt-0.5">Todas as categorias</p>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold text-red-400">{formatBRL(totalGastos)}</p>
            <p className="text-xs text-slate-500 mt-0.5">
              saldo <span className={saldo >= 0 ? 'text-indigo-400' : 'text-red-400'}>{formatBRL(saldo)}</span>
            </p>
          </div>
        </div>
      </section>

      {mostraRelatorio && (
        <Relatorio receitas={receitas} gastos={gastosVisiveis} mes={mesRelatorio} ano={anoRelatorio}
          aba={abaRelatorio} onAba={setAbaRelatorio} onMes={setMesRelatorio} onAno={setAnoRelatorio}
          onClose={() => setMostraRelatorio(false)} />
      )}
    </div>
  )
}

// ─── Subcomponentes ───────────────────────────────────────────────────────────

function SummaryCard({ label, valor, cor }: { label: string; valor: number; cor: string }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className={cn('text-sm font-bold', cor)}>{formatBRL(valor)}</p>
    </div>
  )
}

function ReceitaItem({ receita, mesAtivo, onUpdate, onRemove }: {
  receita: Receita; mesAtivo: string
  onUpdate: (id: string, r: Partial<Receita>) => void; onRemove: (id: string) => void
}) {
  const valorEfetivo = receita.valorMeses?.[mesAtivo] ?? receita.valor
  const [editando, setEditando] = useState(false)
  const [desc, setDesc] = useState(receita.descricao)
  const [valor, setValor] = useState(String(valorEfetivo))
  const [dia, setDia] = useState(String(receita.diaRecebimento))

  // Sync valor when mesAtivo changes
  useEffect(() => {
    setValor(String(receita.valorMeses?.[mesAtivo] ?? receita.valor))
  }, [mesAtivo, receita])

  function salvar() {
    const v = parseFloat(valor.replace(',', '.'))
    if (!desc || isNaN(v)) return
    // Save value as override for this month only
    onUpdate(receita.id, {
      descricao: desc,
      diaRecebimento: parseInt(dia) || receita.diaRecebimento,
      valorMeses: { ...(receita.valorMeses ?? {}), [mesAtivo]: v },
    })
    setEditando(false)
  }
  function cancelar() {
    setDesc(receita.descricao)
    setValor(String(receita.valorMeses?.[mesAtivo] ?? receita.valor))
    setDia(String(receita.diaRecebimento))
    setEditando(false)
  }

  if (editando) return (
    <div className="bg-slate-900 border border-indigo-500/50 rounded-xl px-4 py-3 space-y-2">
      <input value={desc} onChange={(e) => setDesc(e.target.value)} className="w-full bg-slate-800 text-sm text-slate-100 px-3 py-1.5 rounded-lg border border-slate-700 outline-none focus:border-indigo-500" />
      <div className="grid grid-cols-2 gap-2">
        <input value={valor} onChange={(e) => setValor(e.target.value)} inputMode="decimal" placeholder="Valor neste mês" className="bg-slate-800 text-sm text-slate-100 px-3 py-1.5 rounded-lg border border-slate-700 outline-none" />
        <input value={dia} onChange={(e) => setDia(e.target.value)} inputMode="numeric" maxLength={2} placeholder="Dia" className="bg-slate-800 text-sm text-slate-100 px-3 py-1.5 rounded-lg border border-slate-700 outline-none" />
      </div>
      <p className="text-[10px] text-slate-600">Editar valor afeta apenas este mês</p>
      <div className="flex gap-2">
        <button onClick={salvar} className="flex-1 flex items-center justify-center gap-1 bg-indigo-600 text-white text-xs py-1.5 rounded-lg"><Check size={12} /> Salvar</button>
        <button onClick={cancelar} className="flex-1 flex items-center justify-center gap-1 bg-slate-800 text-slate-400 text-xs py-1.5 rounded-lg"><X size={12} /> Cancelar</button>
      </div>
    </div>
  )

  const temOverride = receita.valorMeses?.[mesAtivo] !== undefined

  return (
    <div className="flex items-center justify-between bg-slate-900 rounded-xl px-4 py-3 border border-slate-800">
      <span className="text-sm text-slate-200">{receita.descricao}</span>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-semibold text-green-400">{formatBRL(valorEfetivo)}</p>
          <p className="text-xs text-slate-500">{temOverride ? 'este mês' : `dia ${receita.diaRecebimento}`}</p>
        </div>
        <button onClick={() => setEditando(true)} className="text-slate-500 hover:text-indigo-400 active:text-indigo-400 transition-colors"><Pencil size={14} /></button>
        <button onClick={() => onRemove(receita.id)} className="text-slate-600 hover:text-red-400 active:text-red-400 transition-colors"><Trash2 size={14} /></button>
      </div>
    </div>
  )
}

function AddReceita({ onAdd, mesAtivo, meses }: {
  onAdd: (r: Omit<Receita, 'id'>) => void
  mesAtivo: string
  meses: { key: string; label: string }[]
}) {
  const [aberto, setAberto] = useState(false)
  const [desc, setDesc] = useState('')
  const [valor, setValor] = useState('')
  const [dia, setDia] = useState('')
  const [recorrente, setRecorrente] = useState(true)

  function salvar() {
    const v = parseFloat(valor.replace(',', '.'))
    if (!desc || isNaN(v)) return
    onAdd({
      descricao: desc,
      valor: v,
      valorMeses: {},
      diaRecebimento: parseInt(dia) || 1,
      recorrente,
      mes: recorrente ? undefined : mesAtivo,
    })
    setDesc(''); setValor(''); setDia(''); setAberto(false)
  }

  if (!aberto) return (
    <button onClick={() => setAberto(true)} className="w-full flex items-center justify-center gap-2 border border-dashed border-slate-700 text-slate-500 text-sm py-2.5 rounded-xl hover:border-green-500/50 hover:text-green-400 transition-colors">
      <Plus size={14} /> Adicionar receita
    </button>
  )

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 space-y-2">
      <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Descrição" className="w-full bg-slate-800 text-sm text-slate-100 px-3 py-1.5 rounded-lg border border-slate-700 outline-none focus:border-indigo-500" />
      <div className="grid grid-cols-2 gap-2">
        <input value={valor} onChange={(e) => setValor(e.target.value)} inputMode="decimal" placeholder="Valor" className="bg-slate-800 text-sm text-slate-100 px-3 py-1.5 rounded-lg border border-slate-700 outline-none" />
        <input value={dia} onChange={(e) => setDia(e.target.value)} inputMode="numeric" maxLength={2} placeholder="Dia receb." className="bg-slate-800 text-sm text-slate-100 px-3 py-1.5 rounded-lg border border-slate-700 outline-none" />
      </div>
      <button
        onClick={() => setRecorrente((r) => !r)}
        className={cn('w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-xs transition-colors', recorrente ? 'bg-green-500/20 border-green-500/40 text-green-300' : 'border-slate-700 text-slate-500')}
      >
        <RefreshCw size={12} />
        {recorrente ? 'Recorrente — aparece em todos os meses' : 'Único — apenas em ' + (meses.find(m => m.key === mesAtivo)?.label ?? mesAtivo)}
      </button>
      <div className="flex gap-2">
        <button onClick={salvar} className="flex-1 bg-green-700 text-white text-xs py-1.5 rounded-lg">Salvar</button>
        <button onClick={() => setAberto(false)} className="flex-1 bg-slate-800 text-slate-400 text-xs py-1.5 rounded-lg">Cancelar</button>
      </div>
    </div>
  )
}

function GastoItem({ gasto, mesAtivo, isPago, onToggle, onRemove, onUpdate }: {
  gasto: Gasto; mesAtivo: string; isPago: boolean
  onToggle: (id: string) => void; onRemove: (id: string) => void; onUpdate: (id: string, g: Partial<Gasto>) => void
}) {
  const valorEfetivo = gasto.valorMeses?.[mesAtivo] ?? gasto.valor
  const [editando, setEditando] = useState(false)
  const [desc, setDesc] = useState(gasto.descricao)
  const [valor, setValor] = useState(String(valorEfetivo))
  const [venc, setVenc] = useState(gasto.vencimento ?? '')

  useEffect(() => {
    setValor(String(gasto.valorMeses?.[mesAtivo] ?? gasto.valor))
  }, [mesAtivo, gasto])

  function salvar() {
    const v = parseFloat(valor.replace(',', '.'))
    if (!desc || isNaN(v)) return
    // Save value as override for this month only; don't touch base valor
    onUpdate(gasto.id, {
      descricao: desc,
      vencimento: venc || undefined,
      valorMeses: { ...(gasto.valorMeses ?? {}), [mesAtivo]: v },
    })
    setEditando(false)
  }
  function cancelar() {
    setDesc(gasto.descricao)
    setValor(String(gasto.valorMeses?.[mesAtivo] ?? gasto.valor))
    setVenc(gasto.vencimento ?? '')
    setEditando(false)
  }

  if (editando) return (
    <div className="bg-slate-900 border border-indigo-500/50 rounded-xl px-4 py-3 space-y-2">
      <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Descrição" className="w-full bg-slate-800 text-sm text-slate-100 px-3 py-1.5 rounded-lg border border-slate-700 outline-none focus:border-indigo-500" />
      <div className="grid grid-cols-2 gap-2">
        <input value={valor} onChange={(e) => setValor(e.target.value)} inputMode="decimal" placeholder="Valor neste mês" className="bg-slate-800 text-sm text-slate-100 px-3 py-1.5 rounded-lg border border-slate-700 outline-none focus:border-indigo-500" />
        <input value={venc} onChange={(e) => setVenc(e.target.value)} inputMode="numeric" maxLength={2} placeholder="Vencimento (dia)" className="bg-slate-800 text-sm text-slate-100 px-3 py-1.5 rounded-lg border border-slate-700 outline-none focus:border-indigo-500" />
      </div>
      <p className="text-[10px] text-slate-600">Editar valor afeta apenas este mês</p>
      <div className="flex gap-2">
        <button onClick={salvar} className="flex-1 flex items-center justify-center gap-1 bg-indigo-600 text-white text-xs py-1.5 rounded-lg"><Check size={12} /> Salvar</button>
        <button onClick={cancelar} className="flex-1 flex items-center justify-center gap-1 bg-slate-800 text-slate-400 text-xs py-1.5 rounded-lg"><X size={12} /> Cancelar</button>
      </div>
    </div>
  )

  const temOverride = gasto.valorMeses?.[mesAtivo] !== undefined

  return (
    <div className={cn('flex items-center gap-3 bg-slate-900 rounded-xl px-4 py-3 border border-slate-800 transition-colors', isPago && 'opacity-50')}>
      <button onClick={() => onToggle(gasto.id)} className="shrink-0">
        {isPago ? <CheckCircle size={18} className="text-green-500" /> : <Circle size={18} className="text-slate-600" />}
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className={cn('text-sm', isPago ? 'line-through text-slate-500' : 'text-slate-200')}>{gasto.descricao}</p>
          {gasto.recorrente && <RefreshCw size={10} className="text-slate-600 shrink-0" />}
        </div>
        {gasto.vencimento && <p className="text-xs text-slate-500">vence dia {gasto.vencimento}</p>}
        {temOverride && <p className="text-[10px] text-amber-600">valor deste mês</p>}
      </div>
      <p className="text-sm font-semibold text-slate-300 shrink-0">{formatBRL(valorEfetivo)}</p>
      <button onClick={() => setEditando(true)} className="shrink-0 text-slate-500 hover:text-indigo-400 active:text-indigo-400 transition-colors p-1">
        <Pencil size={15} />
      </button>
      <button onClick={() => onRemove(gasto.id)} className="shrink-0 text-slate-600 hover:text-red-400 active:text-red-400 transition-colors p-1">
        <Trash2 size={15} />
      </button>
    </div>
  )
}

// ─── CategoryBudgetCard ───────────────────────────────────────────────────────

function CategoryBudgetCard({
  cat, label, cor, total, pctDoTotal, budget, budgetValor, pctBudget,
  overBudget, nearBudget, barColor, totalReceitas, onSetBudget, onRemoveBudget,
}: {
  cat: string; label: string; cor: string
  total: number; pctDoTotal: number
  budget: Budget | undefined; budgetValor: number | null; pctBudget: number | null
  overBudget: boolean; nearBudget: boolean; barColor: string
  totalReceitas: number
  onSetBudget: (b: Budget) => void; onRemoveBudget: () => void
}) {
  const [editBudget, setEditBudget] = useState(false)
  const [tipo, setTipo] = useState<'fixo' | 'percentual'>(budget?.tipo ?? 'percentual')
  const [valor, setValor] = useState(budget ? String(budget.valor) : '')

  function salvarBudget() {
    const v = parseFloat(valor.replace(',', '.'))
    if (isNaN(v) || v <= 0) return
    onSetBudget({ tipo, valor: v })
    setEditBudget(false)
  }
  function abrirEdit() {
    setTipo(budget?.tipo ?? 'percentual')
    setValor(budget ? String(budget.valor) : '')
    setEditBudget(true)
  }

  return (
    <div className={cn('bg-slate-900 border rounded-xl px-4 py-3', overBudget ? 'border-red-500/40' : nearBudget ? 'border-amber-500/30' : 'border-slate-800')}>
      <div className="flex justify-between items-center mb-1.5">
        <span className={cn('text-xs px-2 py-0.5 rounded-full border', cor)}>{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-200">{formatBRL(total)}</span>
          <button onClick={abrirEdit} className="text-slate-600 hover:text-indigo-400 active:text-indigo-400 transition-colors" title="Definir orçamento">
            <Pencil size={12} />
          </button>
        </div>
      </div>

      {/* Barra de progresso */}
      <div className="w-full bg-slate-800 rounded-full h-1.5">
        <div
          className={cn('h-1.5 rounded-full transition-all', barColor)}
          style={{ width: `${budgetValor !== null ? pctBudget ?? 0 : pctDoTotal}%` }}
        />
      </div>

      {/* Legenda abaixo da barra */}
      {budgetValor !== null ? (
        <div className="flex justify-between items-center mt-1">
          <p className={cn('text-xs', overBudget ? 'text-red-400 font-medium' : nearBudget ? 'text-amber-400' : 'text-slate-600')}>
            {overBudget ? `Acima em ${formatBRL(total - budgetValor)}` : `Restam ${formatBRL(budgetValor - total)}`}
          </p>
          <p className="text-xs text-slate-600">
            limite {budget?.tipo === 'percentual' ? `${budget.valor}% da renda` : formatBRL(budgetValor)}
          </p>
        </div>
      ) : (
        <p className="text-xs text-slate-600 mt-1">{pctDoTotal.toFixed(0)}% do total de gastos</p>
      )}

      {/* Inline budget editor */}
      {editBudget && (
        <div className="mt-3 pt-3 border-t border-slate-800 space-y-2">
          <div className="flex gap-2">
            <button
              onClick={() => setTipo('percentual')}
              className={cn('flex-1 text-xs py-1.5 rounded-lg border transition-colors', tipo === 'percentual' ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300' : 'border-slate-700 text-slate-500')}
            >% da renda</button>
            <button
              onClick={() => setTipo('fixo')}
              className={cn('flex-1 text-xs py-1.5 rounded-lg border transition-colors', tipo === 'fixo' ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300' : 'border-slate-700 text-slate-500')}
            >Valor fixo</button>
          </div>
          <div className="flex gap-2 items-center">
            <input
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              inputMode="decimal"
              placeholder={tipo === 'percentual' ? 'ex: 3 (= 3%)' : 'ex: 500'}
              className="flex-1 bg-slate-800 text-sm text-slate-100 px-3 py-1.5 rounded-lg border border-slate-700 outline-none focus:border-indigo-500"
            />
            {tipo === 'percentual' && totalReceitas > 0 && (
              <span className="text-xs text-slate-500 shrink-0">
                = {formatBRL((totalReceitas * (parseFloat(valor.replace(',', '.')) || 0)) / 100)}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={salvarBudget} className="flex-1 bg-indigo-600 text-white text-xs py-1.5 rounded-lg">Salvar</button>
            {budget && (
              <button onClick={() => { onRemoveBudget(); setEditBudget(false) }} className="px-3 bg-slate-800 text-red-400 text-xs py-1.5 rounded-lg">Remover</button>
            )}
            <button onClick={() => setEditBudget(false)} className="flex-1 bg-slate-800 text-slate-400 text-xs py-1.5 rounded-lg">Cancelar</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Modal de Relatório ───────────────────────────────────────────────────────

const MESES_NOMES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

function Relatorio({ receitas, gastos, mes, ano, aba, onAba, onMes, onAno, onClose }: {
  receitas: Receita[]; gastos: Gasto[]; mes: number; ano: number
  aba: 'mensal' | 'anual'; onAba: (a: 'mensal' | 'anual') => void
  onMes: (m: number) => void; onAno: (a: number) => void; onClose: () => void
}) {
  const mult = aba === 'anual' ? 12 : 1
  const totalReceitas = receitas.reduce((a, r) => a + r.valor, 0) * mult
  const totalGastos = gastos.reduce((a, g) => a + g.valor, 0) * mult
  const saldo = totalReceitas - totalGastos
  const anos = [ano - 1, ano, ano + 1]

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end justify-center" onClick={onClose}>
      <div className="w-full max-w-2xl bg-slate-950 border border-slate-800 rounded-t-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-100">Relatório</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300"><X size={20} /></button>
        </div>
        <div className="flex bg-slate-900 rounded-xl p-1 border border-slate-800">
          {(['mensal', 'anual'] as const).map((a) => (
            <button key={a} onClick={() => onAba(a)} className={cn('flex-1 text-sm py-1.5 rounded-lg font-medium capitalize transition-colors', aba === a ? 'bg-indigo-600 text-white' : 'text-slate-500')}>
              {a === 'mensal' ? 'Mensal' : 'Anual'}
            </button>
          ))}
        </div>
        {aba === 'mensal' ? (
          <div className="flex gap-2">
            <select value={mes} onChange={(e) => onMes(Number(e.target.value))} className="flex-1 bg-slate-900 text-slate-100 text-sm px-3 py-2 rounded-xl border border-slate-800 outline-none">
              {MESES_NOMES.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
            <select value={ano} onChange={(e) => onAno(Number(e.target.value))} className="w-28 bg-slate-900 text-slate-100 text-sm px-3 py-2 rounded-xl border border-slate-800 outline-none">
              {anos.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        ) : (
          <select value={ano} onChange={(e) => onAno(Number(e.target.value))} className="w-full bg-slate-900 text-slate-100 text-sm px-3 py-2 rounded-xl border border-slate-800 outline-none">
            {anos.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        )}
        <p className="text-xs text-slate-500 text-center">
          {aba === 'mensal' ? `${MESES_NOMES[mes]} ${ano}` : `Projeção anual ${ano}`}
        </p>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
            <div className="flex items-center gap-1 mb-1"><TrendingUp size={12} className="text-green-400" /><p className="text-xs text-slate-500">Receitas</p></div>
            <p className="text-sm font-bold text-green-400">{formatBRL(totalReceitas)}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
            <div className="flex items-center gap-1 mb-1"><TrendingDown size={12} className="text-red-400" /><p className="text-xs text-slate-500">Gastos</p></div>
            <p className="text-sm font-bold text-red-400">{formatBRL(totalGastos)}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
            <p className="text-xs text-slate-500 mb-1">Saldo</p>
            <p className={cn('text-sm font-bold', saldo >= 0 ? 'text-indigo-400' : 'text-red-400')}>{formatBRL(saldo)}</p>
          </div>
        </div>
        <section>
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Receitas</h3>
          <div className="space-y-1.5">
            {receitas.map((r) => (
              <div key={r.id} className="flex justify-between items-center bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5">
                <span className="text-sm text-slate-300">{r.descricao}</span>
                <span className="text-sm font-semibold text-green-400">{formatBRL(r.valor * mult)}</span>
              </div>
            ))}
          </div>
        </section>
        <section>
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Gastos por categoria</h3>
          <div className="space-y-1.5">
            {(Object.entries(CATEGORIAS) as [Categoria, { label: string; cor: string }][]).map(([cat, { label, cor }]) => {
              const itens = gastos.filter((g) => g.categoria === cat)
              const total = itens.reduce((a, g) => a + g.valor, 0) * mult
              if (itens.length === 0) return null
              return (
                <div key={cat} className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className={cn('text-xs px-2 py-0.5 rounded-full border', cor)}>{label}</span>
                    <span className="text-sm font-bold text-slate-200">{formatBRL(total)}</span>
                  </div>
                  {itens.map((g) => (
                    <div key={g.id} className="flex justify-between text-xs text-slate-500 py-0.5">
                      <span>{g.descricao}</span><span>{formatBRL(g.valor * mult)}</span>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}
