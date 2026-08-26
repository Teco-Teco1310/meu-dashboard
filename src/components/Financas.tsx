'use client'
import { useState } from 'react'
import { useStore, Gasto, Receita, Categoria } from '@/lib/store'
import { formatBRL, CATEGORIAS } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { Plus, Trash2, CheckCircle, Circle, Pencil, Check, X, FileText, TrendingUp, TrendingDown } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const CATS = Object.entries(CATEGORIAS) as [Categoria, { label: string; cor: string }][]
const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

// ─── Componente principal ─────────────────────────────────────────────────────

export default function Financas() {
  const { gastos, receitas, addGasto, removeGasto, togglePago, updateGasto, updateReceita, addReceita, removeReceita } = useStore()
  const [catAtiva, setCatAtiva] = useState<Categoria>('contas_casa')
  const [form, setForm] = useState({ descricao: '', valor: '', vencimento: '' })
  const [mostraForm, setMostraForm] = useState(false)
  const [mostraRelatorio, setMostraRelatorio] = useState(false)
  const [abaRelatorio, setAbaRelatorio] = useState<'mensal' | 'anual'>('mensal')
  const [mesRelatorio, setMesRelatorio] = useState(new Date().getMonth())
  const [anoRelatorio, setAnoRelatorio] = useState(new Date().getFullYear())

  const totalReceitas = receitas.reduce((a, r) => a + r.valor, 0)
  const totalGastos = gastos.reduce((a, g) => a + g.valor, 0)
  const saldo = totalReceitas - totalGastos

  const gastosPorCat = (cat: Categoria) => gastos.filter((g) => g.categoria === cat)
  const totalCat = (cat: Categoria) => gastosPorCat(cat).reduce((a, g) => a + g.valor, 0)

  const salvar = () => {
    if (!form.descricao || !form.valor) return
    addGasto({ descricao: form.descricao, valor: parseFloat(form.valor.replace(',', '.')), categoria: catAtiva, vencimento: form.vencimento || undefined, pago: false })
    setForm({ descricao: '', valor: '', vencimento: '' })
    setMostraForm(false)
  }

  return (
    <div className="p-4 space-y-5">
      {/* Resumo */}
      <div className="grid grid-cols-3 gap-3">
        <SummaryCard label="Receitas" valor={totalReceitas} cor="text-green-400" />
        <SummaryCard label="Gastos" valor={totalGastos} cor="text-red-400" />
        <SummaryCard label="Saldo" valor={saldo} cor={saldo >= 0 ? 'text-indigo-400' : 'text-red-400'} />
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
          {receitas.map((r) => (
            <ReceitaItem key={r.id} receita={r} onUpdate={updateReceita} onRemove={removeReceita} />
          ))}
          <AddReceita onAdd={addReceita} />
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
            <GastoItem key={g.id} gasto={g} onToggle={togglePago} onRemove={removeGasto} onUpdate={updateGasto} />
          ))}
          {gastosPorCat(catAtiva).length === 0 && (
            <p className="text-xs text-slate-600 text-center py-4">
              Nenhum gasto em {CATEGORIAS[catAtiva].label.toLowerCase()}
            </p>
          )}
        </div>

        {/* Total da categoria */}
        {gastosPorCat(catAtiva).length > 0 && (
          <div className="flex justify-between items-center px-1 pt-3 border-t border-slate-800 mt-2">
            <span className="text-xs text-slate-500">Total {CATEGORIAS[catAtiva].label}</span>
            <span className="text-sm font-bold text-slate-200">{formatBRL(totalCat(catAtiva))}</span>
          </div>
        )}

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
              <button onClick={salvar} className="flex-1 bg-indigo-600 text-white text-sm py-2 rounded-lg font-medium">Salvar</button>
              <button onClick={() => setMostraForm(false)} className="flex-1 bg-slate-800 text-slate-300 text-sm py-2 rounded-lg">Cancelar</button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setMostraForm(true)}
            className="mt-3 w-full flex items-center justify-center gap-2 border border-dashed border-slate-700 text-slate-500 text-sm py-3 rounded-xl hover:border-indigo-500 hover:text-indigo-400 transition-colors"
          >
            <Plus size={16} /> Adicionar em {CATEGORIAS[catAtiva].label}
          </button>
        )}
      </section>

      {/* Totais por categoria — visão geral */}
      <section>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Resumo por categoria</h2>
        <div className="space-y-2">
          {CATS.map(([cat, { label, cor }]) => {
            const total = totalCat(cat)
            const pct = totalGastos > 0 ? (total / totalGastos) * 100 : 0
            return (
              <div key={cat} className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3">
                <div className="flex justify-between items-center mb-1.5">
                  <span className={cn('text-xs px-2 py-0.5 rounded-full border', cor)}>{label}</span>
                  <span className="text-sm font-semibold text-slate-200">{formatBRL(total)}</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1">
                  <div className="bg-indigo-500 h-1 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
                <p className="text-xs text-slate-600 mt-1">{pct.toFixed(0)}% do total de gastos</p>
              </div>
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
              saldo <span className={totalGastos <= receitas.reduce((a,r)=>a+r.valor,0) ? 'text-indigo-400' : 'text-red-400'}>
                {formatBRL(receitas.reduce((a,r)=>a+r.valor,0) - totalGastos)}
              </span>
            </p>
          </div>
        </div>
      </section>

      {/* Modal de relatório */}
      {mostraRelatorio && (
        <Relatorio
          receitas={receitas}
          gastos={gastos}
          mes={mesRelatorio}
          ano={anoRelatorio}
          aba={abaRelatorio}
          onAba={setAbaRelatorio}
          onMes={setMesRelatorio}
          onAno={setAnoRelatorio}
          onClose={() => setMostraRelatorio(false)}
        />
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

function ReceitaItem({ receita, onUpdate, onRemove }: {
  receita: Receita
  onUpdate: (id: string, r: Partial<Receita>) => void
  onRemove: (id: string) => void
}) {
  const [editando, setEditando] = useState(false)
  const [desc, setDesc] = useState(receita.descricao)
  const [valor, setValor] = useState(String(receita.valor))
  const [dia, setDia] = useState(String(receita.diaRecebimento))

  function salvar() {
    const v = parseFloat(valor.replace(',', '.'))
    if (!desc || isNaN(v)) return
    onUpdate(receita.id, { descricao: desc, valor: v, diaRecebimento: parseInt(dia) || receita.diaRecebimento })
    setEditando(false)
  }

  function cancelar() {
    setDesc(receita.descricao)
    setValor(String(receita.valor))
    setDia(String(receita.diaRecebimento))
    setEditando(false)
  }

  if (editando) {
    return (
      <div className="bg-slate-900 border border-indigo-500/50 rounded-xl px-4 py-3 space-y-2">
        <input value={desc} onChange={(e) => setDesc(e.target.value)} className="w-full bg-slate-800 text-sm text-slate-100 px-3 py-1.5 rounded-lg border border-slate-700 outline-none focus:border-indigo-500" />
        <div className="grid grid-cols-2 gap-2">
          <input value={valor} onChange={(e) => setValor(e.target.value)} inputMode="decimal" placeholder="Valor" className="bg-slate-800 text-sm text-slate-100 px-3 py-1.5 rounded-lg border border-slate-700 outline-none focus:border-indigo-500" />
          <input value={dia} onChange={(e) => setDia(e.target.value)} inputMode="numeric" maxLength={2} placeholder="Dia" className="bg-slate-800 text-sm text-slate-100 px-3 py-1.5 rounded-lg border border-slate-700 outline-none focus:border-indigo-500" />
        </div>
        <div className="flex gap-2">
          <button onClick={salvar} className="flex-1 flex items-center justify-center gap-1 bg-indigo-600 text-white text-xs py-1.5 rounded-lg"><Check size={12} /> Salvar</button>
          <button onClick={cancelar} className="flex-1 flex items-center justify-center gap-1 bg-slate-800 text-slate-400 text-xs py-1.5 rounded-lg"><X size={12} /> Cancelar</button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between bg-slate-900 rounded-xl px-4 py-3 border border-slate-800 group">
      <span className="text-sm text-slate-200">{receita.descricao}</span>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-semibold text-green-400">{formatBRL(receita.valor)}</p>
          <p className="text-xs text-slate-500">dia {receita.diaRecebimento}</p>
        </div>
        <button onClick={() => setEditando(true)} className="text-slate-700 hover:text-indigo-400 transition-colors opacity-0 group-hover:opacity-100">
          <Pencil size={14} />
        </button>
        <button onClick={() => onRemove(receita.id)} className="text-slate-700 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}

function AddReceita({ onAdd }: { onAdd: (r: Omit<Receita, 'id'>) => void }) {
  const [aberto, setAberto] = useState(false)
  const [desc, setDesc] = useState('')
  const [valor, setValor] = useState('')
  const [dia, setDia] = useState('')

  function salvar() {
    const v = parseFloat(valor.replace(',', '.'))
    if (!desc || isNaN(v)) return
    onAdd({ descricao: desc, valor: v, diaRecebimento: parseInt(dia) || 1 })
    setDesc(''); setValor(''); setDia('')
    setAberto(false)
  }

  if (!aberto) {
    return (
      <button onClick={() => setAberto(true)} className="w-full flex items-center justify-center gap-2 border border-dashed border-slate-700 text-slate-500 text-sm py-2.5 rounded-xl hover:border-green-500/50 hover:text-green-400 transition-colors">
        <Plus size={14} /> Adicionar receita
      </button>
    )
  }

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 space-y-2">
      <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Descrição da receita" className="w-full bg-slate-800 text-sm text-slate-100 px-3 py-1.5 rounded-lg border border-slate-700 outline-none focus:border-indigo-500" />
      <div className="grid grid-cols-2 gap-2">
        <input value={valor} onChange={(e) => setValor(e.target.value)} inputMode="decimal" placeholder="Valor" className="bg-slate-800 text-sm text-slate-100 px-3 py-1.5 rounded-lg border border-slate-700 outline-none focus:border-indigo-500" />
        <input value={dia} onChange={(e) => setDia(e.target.value)} inputMode="numeric" maxLength={2} placeholder="Dia receb." className="bg-slate-800 text-sm text-slate-100 px-3 py-1.5 rounded-lg border border-slate-700 outline-none focus:border-indigo-500" />
      </div>
      <div className="flex gap-2">
        <button onClick={salvar} className="flex-1 bg-green-700 text-white text-xs py-1.5 rounded-lg">Salvar</button>
        <button onClick={() => setAberto(false)} className="flex-1 bg-slate-800 text-slate-400 text-xs py-1.5 rounded-lg">Cancelar</button>
      </div>
    </div>
  )
}

function GastoItem({ gasto, onToggle, onRemove, onUpdate }: {
  gasto: Gasto
  onToggle: (id: string) => void
  onRemove: (id: string) => void
  onUpdate: (id: string, g: Partial<Gasto>) => void
}) {
  const [editando, setEditando] = useState(false)
  const [desc, setDesc] = useState(gasto.descricao)
  const [valor, setValor] = useState(String(gasto.valor))
  const [venc, setVenc] = useState(gasto.vencimento ?? '')

  function salvar() {
    const v = parseFloat(valor.replace(',', '.'))
    if (!desc || isNaN(v)) return
    onUpdate(gasto.id, { descricao: desc, valor: v, vencimento: venc || undefined })
    setEditando(false)
  }

  function cancelar() {
    setDesc(gasto.descricao)
    setValor(String(gasto.valor))
    setVenc(gasto.vencimento ?? '')
    setEditando(false)
  }

  if (editando) {
    return (
      <div className="bg-slate-900 border border-indigo-500/50 rounded-xl px-4 py-3 space-y-2">
        <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Descrição"
          className="w-full bg-slate-800 text-sm text-slate-100 px-3 py-1.5 rounded-lg border border-slate-700 outline-none focus:border-indigo-500" />
        <div className="grid grid-cols-2 gap-2">
          <input value={valor} onChange={(e) => setValor(e.target.value)} inputMode="decimal" placeholder="Valor"
            className="bg-slate-800 text-sm text-slate-100 px-3 py-1.5 rounded-lg border border-slate-700 outline-none focus:border-indigo-500" />
          <input value={venc} onChange={(e) => setVenc(e.target.value)} inputMode="numeric" maxLength={2} placeholder="Vencimento (dia)"
            className="bg-slate-800 text-sm text-slate-100 px-3 py-1.5 rounded-lg border border-slate-700 outline-none focus:border-indigo-500" />
        </div>
        <div className="flex gap-2">
          <button onClick={salvar} className="flex-1 flex items-center justify-center gap-1 bg-indigo-600 text-white text-xs py-1.5 rounded-lg"><Check size={12} /> Salvar</button>
          <button onClick={cancelar} className="flex-1 flex items-center justify-center gap-1 bg-slate-800 text-slate-400 text-xs py-1.5 rounded-lg"><X size={12} /> Cancelar</button>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('flex items-center gap-3 bg-slate-900 rounded-xl px-4 py-3 border transition-colors group', gasto.pago ? 'border-slate-800 opacity-50' : 'border-slate-800')}>
      <button onClick={() => onToggle(gasto.id)} className="shrink-0">
        {gasto.pago ? <CheckCircle size={18} className="text-green-500" /> : <Circle size={18} className="text-slate-600" />}
      </button>
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm', gasto.pago ? 'line-through text-slate-500' : 'text-slate-200')}>{gasto.descricao}</p>
        {gasto.vencimento && <p className="text-xs text-slate-500">vence dia {gasto.vencimento}</p>}
      </div>
      <p className="text-sm font-semibold text-slate-300 shrink-0">{formatBRL(gasto.valor)}</p>
      <button onClick={() => setEditando(true)} className="shrink-0 text-slate-700 hover:text-indigo-400 transition-colors opacity-0 group-hover:opacity-100">
        <Pencil size={14} />
      </button>
      <button onClick={() => onRemove(gasto.id)} className="shrink-0 text-slate-700 hover:text-red-400 transition-colors">
        <Trash2 size={15} />
      </button>
    </div>
  )
}

// ─── Modal de Relatório ───────────────────────────────────────────────────────

const MESES_NOMES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

function Relatorio({ receitas, gastos, mes, ano, aba, onAba, onMes, onAno, onClose }: {
  receitas: Receita[]
  gastos: Gasto[]
  mes: number
  ano: number
  aba: 'mensal' | 'anual'
  onAba: (a: 'mensal' | 'anual') => void
  onMes: (m: number) => void
  onAno: (a: number) => void
  onClose: () => void
}) {
  const mult = aba === 'anual' ? 12 : 1
  const totalReceitas = receitas.reduce((a, r) => a + r.valor, 0) * mult
  const totalGastos = gastos.reduce((a, g) => a + g.valor, 0) * mult
  const saldo = totalReceitas - totalGastos

  const anos = [ano - 1, ano, ano + 1]

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end justify-center" onClick={onClose}>
      <div className="w-full max-w-2xl bg-slate-950 border border-slate-800 rounded-t-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-100">Relatório</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300"><X size={20} /></button>
        </div>

        {/* Tabs mensal/anual */}
        <div className="flex bg-slate-900 rounded-xl p-1 border border-slate-800">
          {(['mensal', 'anual'] as const).map((a) => (
            <button key={a} onClick={() => onAba(a)} className={cn('flex-1 text-sm py-1.5 rounded-lg font-medium capitalize transition-colors', aba === a ? 'bg-indigo-600 text-white' : 'text-slate-500')}>
              {a === 'mensal' ? 'Mensal' : 'Anual'}
            </button>
          ))}
        </div>

        {/* Seletor de período */}
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

        {/* Título do período */}
        <p className="text-xs text-slate-500 text-center">
          {aba === 'mensal' ? `${MESES_NOMES[mes]} ${ano}` : `Projeção anual ${ano} (baseada no mês atual)`}
        </p>

        {/* Cards de resumo */}
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

        {/* Receitas detalhadas */}
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

        {/* Gastos por categoria */}
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
                  <div className="space-y-1">
                    {itens.map((g) => (
                      <div key={g.id} className="flex justify-between text-xs text-slate-500">
                        <span>{g.descricao}</span>
                        <span>{formatBRL(g.valor * mult)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}
