'use client'
import { useState, useMemo } from 'react'
import { useStore, Tarefa } from '@/lib/store'
import { TIPO_TAREFA } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, parseISO, addMonths, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Plus, ChevronLeft, ChevronRight, CheckCircle, Circle, Trash2, Clock, Calendar } from 'lucide-react'

export default function Trabalho() {
  const { tarefas, addTarefa, removeTarefa, toggleConcluida } = useStore()
  const [mesSelecionado, setMesSelecionado] = useState(new Date())
  const [diaSelecionado, setDiaSelecionado] = useState(new Date())
  const [mostraForm, setMostraForm] = useState(false)
  const [form, setForm] = useState({ titulo: '', descricao: '', hora: '', tipo: 'tarefa' as Tarefa['tipo'] })
  const [abaSelecionada, setAbaSelecionada] = useState<'calendario' | 'lista'>('calendario')

  const diasDoMes = useMemo(() =>
    eachDayOfInterval({ start: startOfMonth(mesSelecionado), end: endOfMonth(mesSelecionado) }),
    [mesSelecionado]
  )

  const tarefasDoDia = tarefas.filter((t) => isSameDay(parseISO(t.data), diaSelecionado))

  const diasComTarefa = new Set(tarefas.map((t) => t.data.slice(0, 10)))

  const salvar = () => {
    if (!form.titulo) return
    addTarefa({
      titulo: form.titulo,
      descricao: form.descricao || undefined,
      data: format(diaSelecionado, 'yyyy-MM-dd'),
      hora: form.hora || undefined,
      tipo: form.tipo,
      concluida: false,
    })
    setForm({ titulo: '', descricao: '', hora: '', tipo: 'tarefa' })
    setMostraForm(false)
  }

  const diaSemana0 = startOfMonth(mesSelecionado).getDay()

  return (
    <div className="p-4 space-y-4">
      {/* Tabs */}
      <div className="flex bg-slate-900 rounded-xl p-1 border border-slate-800">
        {([['calendario', 'Calendário'], ['lista', 'Lista']] as const).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setAbaSelecionada(id)}
            className={cn(
              'flex-1 text-sm py-1.5 rounded-lg font-medium transition-colors',
              abaSelecionada === id ? 'bg-indigo-600 text-white' : 'text-slate-500'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {abaSelecionada === 'calendario' ? (
        <>
          {/* Cabeçalho do mês */}
          <div className="flex items-center justify-between">
            <button onClick={() => setMesSelecionado(subMonths(mesSelecionado, 1))} className="p-2 text-slate-400">
              <ChevronLeft size={20} />
            </button>
            <h2 className="text-sm font-semibold text-slate-200 capitalize">
              {format(mesSelecionado, 'MMMM yyyy', { locale: ptBR })}
            </h2>
            <button onClick={() => setMesSelecionado(addMonths(mesSelecionado, 1))} className="p-2 text-slate-400">
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Dias da semana */}
          <div className="grid grid-cols-7 text-center mb-1">
            {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
              <span key={i} className="text-xs text-slate-600 py-1">{d}</span>
            ))}
          </div>

          {/* Grade do calendário */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: diaSemana0 }).map((_, i) => <div key={`e${i}`} />)}
            {diasDoMes.map((dia) => {
              const key = format(dia, 'yyyy-MM-dd')
              const temTarefa = diasComTarefa.has(key)
              const selecionado = isSameDay(dia, diaSelecionado)
              const hoje = isToday(dia)
              return (
                <button
                  key={key}
                  onClick={() => { setDiaSelecionado(dia); setMostraForm(false) }}
                  className={cn(
                    'aspect-square rounded-xl text-sm flex flex-col items-center justify-center gap-0.5 transition-colors',
                    selecionado ? 'bg-indigo-600 text-white' :
                    hoje ? 'border border-indigo-500 text-indigo-400' :
                    'text-slate-400 hover:bg-slate-800'
                  )}
                >
                  {dia.getDate()}
                  {temTarefa && (
                    <span className={cn('w-1 h-1 rounded-full', selecionado ? 'bg-white' : 'bg-indigo-400')} />
                  )}
                </button>
              )
            })}
          </div>

          {/* Tarefas do dia selecionado */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {isToday(diaSelecionado) ? 'Hoje' : format(diaSelecionado, "d 'de' MMMM", { locale: ptBR })}
              </h3>
              <button
                onClick={() => setMostraForm(!mostraForm)}
                className="text-xs text-indigo-400 flex items-center gap-1"
              >
                <Plus size={14} /> Adicionar
              </button>
            </div>

            {mostraForm && (
              <div className="mb-3 bg-slate-900 border border-slate-700 rounded-xl p-4 space-y-3">
                <input
                  placeholder="Título"
                  value={form.titulo}
                  onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
                  className="w-full bg-slate-800 text-sm text-slate-100 px-3 py-2 rounded-lg border border-slate-700 outline-none focus:border-indigo-500"
                />
                <input
                  placeholder="Descrição (opcional)"
                  value={form.descricao}
                  onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
                  className="w-full bg-slate-800 text-sm text-slate-100 px-3 py-2 rounded-lg border border-slate-700 outline-none focus:border-indigo-500"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="time"
                    value={form.hora}
                    onChange={(e) => setForm((f) => ({ ...f, hora: e.target.value }))}
                    className="bg-slate-800 text-sm text-slate-100 px-3 py-2 rounded-lg border border-slate-700 outline-none focus:border-indigo-500"
                  />
                  <select
                    value={form.tipo}
                    onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value as Tarefa['tipo'] }))}
                    className="bg-slate-800 text-sm text-slate-100 px-3 py-2 rounded-lg border border-slate-700 outline-none focus:border-indigo-500"
                  >
                    <option value="reuniao">Reunião</option>
                    <option value="tarefa">Tarefa</option>
                    <option value="prazo">Prazo</option>
                  </select>
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
            )}

            <div className="space-y-2">
              {tarefasDoDia.length === 0 && (
                <p className="text-xs text-slate-600 text-center py-6">
                  Nenhuma tarefa para este dia
                </p>
              )}
              {tarefasDoDia
                .sort((a, b) => (a.hora ?? '99:99') > (b.hora ?? '99:99') ? 1 : -1)
                .map((t) => <TarefaItem key={t.id} tarefa={t} onToggle={toggleConcluida} onRemove={removeTarefa} />)}
            </div>
          </section>
        </>
      ) : (
        /* Lista completa */
        <section className="space-y-2">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Todas as tarefas</h2>
          {tarefas.length === 0 && (
            <p className="text-xs text-slate-600 text-center py-10">
              Nenhuma tarefa cadastrada ainda
            </p>
          )}
          {[...tarefas]
            .sort((a, b) => a.data > b.data ? 1 : -1)
            .map((t) => <TarefaItem key={t.id} tarefa={t} onToggle={toggleConcluida} onRemove={removeTarefa} showDate />)}
        </section>
      )}
    </div>
  )
}

function TarefaItem({ tarefa, onToggle, onRemove, showDate }: {
  tarefa: Tarefa
  onToggle: (id: string) => void
  onRemove: (id: string) => void
  showDate?: boolean
}) {
  const tipo = TIPO_TAREFA[tarefa.tipo]
  return (
    <div className={cn(
      'flex items-start gap-3 bg-slate-900 rounded-xl px-4 py-3 border border-slate-800',
      tarefa.concluida && 'opacity-50'
    )}>
      <button onClick={() => onToggle(tarefa.id)} className="shrink-0 mt-0.5">
        {tarefa.concluida
          ? <CheckCircle size={18} className="text-green-500" />
          : <Circle size={18} className="text-slate-600" />}
      </button>
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm', tarefa.concluida ? 'line-through text-slate-500' : 'text-slate-200')}>
          {tarefa.titulo}
        </p>
        {tarefa.descricao && (
          <p className="text-xs text-slate-500 mt-0.5">{tarefa.descricao}</p>
        )}
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <span className={cn('text-xs px-2 py-0.5 rounded-full border', tipo.bg, tipo.cor)}>
            {tipo.label}
          </span>
          {tarefa.hora && (
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Clock size={11} /> {tarefa.hora}
            </span>
          )}
          {showDate && (
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Calendar size={11} />
              {format(parseISO(tarefa.data), "d MMM", { locale: ptBR })}
            </span>
          )}
        </div>
      </div>
      <button onClick={() => onRemove(tarefa.id)} className="shrink-0 text-slate-700 hover:text-red-400 transition-colors">
        <Trash2 size={15} />
      </button>
    </div>
  )
}
