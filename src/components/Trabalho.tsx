'use client'
import { useState, useMemo } from 'react'
import { useStore, Tarefa, Todo, Nota } from '@/lib/store'
import { TIPO_TAREFA } from '@/lib/utils'
import { cn } from '@/lib/utils'
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  isSameDay, isToday, parseISO, addMonths, subMonths
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Plus, ChevronLeft, ChevronRight, CheckCircle, Circle,
  Trash2, Clock, Calendar, BookOpen, ListTodo, ChevronDown,
  Tag, Pencil, X, Check, ArrowUp, Minus, ArrowDown
} from 'lucide-react'

type AbaTrabalho = 'calendario' | 'todo' | 'estudos'

const PRIORIDADE = {
  alta:  { label: 'Alta',  cor: 'text-red-300',    bg: 'bg-red-500/20 border-red-500/40',    icon: ArrowUp },
  media: { label: 'Média', cor: 'text-yellow-300',  bg: 'bg-yellow-500/20 border-yellow-500/40', icon: Minus },
  baixa: { label: 'Baixa', cor: 'text-slate-400',   bg: 'bg-slate-500/20 border-slate-500/40',  icon: ArrowDown },
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function Trabalho() {
  const [aba, setAba] = useState<AbaTrabalho>('calendario')

  return (
    <div className="p-4 space-y-4">
      {/* Tabs principais */}
      <div className="flex bg-slate-900 rounded-xl p-1 border border-slate-800 gap-1">
        {([
          { id: 'calendario', label: 'Calendário', Icon: Calendar },
          { id: 'todo',       label: 'ToDo',       Icon: ListTodo },
          { id: 'estudos',    label: 'Estudos',    Icon: BookOpen },
        ] as const).map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setAba(id)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 text-xs py-2 rounded-lg font-medium transition-colors',
              aba === id ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'
            )}
          >
            <Icon size={13} />{label}
          </button>
        ))}
      </div>

      {aba === 'calendario' && <Calendario />}
      {aba === 'todo'       && <TodoList />}
      {aba === 'estudos'    && <Estudos />}
    </div>
  )
}

// ─── Calendário ───────────────────────────────────────────────────────────────

function Calendario() {
  const { tarefas, addTarefa, removeTarefa, toggleConcluida, updateTarefa } = useStore()
  const [mes, setMes] = useState(new Date())
  const [diaAtivo, setDiaAtivo] = useState(new Date())
  const [mostraForm, setMostraForm] = useState(false)
  const [vistaLista, setVistaLista] = useState(false)
  const [form, setForm] = useState({ titulo: '', descricao: '', hora: '', tipo: 'tarefa' as Tarefa['tipo'] })

  const diasDoMes = useMemo(() =>
    eachDayOfInterval({ start: startOfMonth(mes), end: endOfMonth(mes) }), [mes])

  const diasComTarefa = useMemo(() =>
    new Set(tarefas.map((t) => t.data.slice(0, 10))), [tarefas])

  const tarefasDoDia = tarefas.filter((t) => isSameDay(parseISO(t.data), diaAtivo))

  const salvar = () => {
    if (!form.titulo) return
    addTarefa({ titulo: form.titulo, descricao: form.descricao || undefined, data: format(diaAtivo, 'yyyy-MM-dd'), hora: form.hora || undefined, tipo: form.tipo, concluida: false })
    setForm({ titulo: '', descricao: '', hora: '', tipo: 'tarefa' })
    setMostraForm(false)
  }

  const diaSemana0 = startOfMonth(mes).getDay()

  if (vistaLista) {
    return (
      <section className="space-y-2">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Todas as tarefas</h2>
          <button onClick={() => setVistaLista(false)} className="text-xs text-indigo-400">← Calendário</button>
        </div>
        {tarefas.length === 0 && <p className="text-xs text-slate-600 text-center py-10">Nenhuma tarefa cadastrada</p>}
        {[...tarefas].sort((a, b) => a.data > b.data ? 1 : -1).map((t) => (
          <TarefaItem key={t.id} tarefa={t} onToggle={toggleConcluida} onRemove={removeTarefa} onUpdate={updateTarefa} showDate />
        ))}
      </section>
    )
  }

  return (
    <>
      {/* Navegação do mês */}
      <div className="flex items-center justify-between">
        <button onClick={() => setMes(subMonths(mes, 1))} className="p-2 text-slate-400 hover:text-slate-200">
          <ChevronLeft size={20} />
        </button>
        <button
          onClick={() => setMes(new Date())}
          className="text-sm font-semibold text-slate-200 capitalize hover:text-indigo-400 transition-colors"
        >
          {format(mes, 'MMMM yyyy', { locale: ptBR })}
        </button>
        <button onClick={() => setMes(addMonths(mes, 1))} className="p-2 text-slate-400 hover:text-slate-200">
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Cabeçalho dias da semana */}
      <div className="grid grid-cols-7 text-center">
        {['D','S','T','Q','Q','S','S'].map((d, i) => (
          <span key={i} className="text-xs text-slate-600 py-1">{d}</span>
        ))}
      </div>

      {/* Grade */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: diaSemana0 }).map((_, i) => <div key={`e${i}`} />)}
        {diasDoMes.map((dia) => {
          const key = format(dia, 'yyyy-MM-dd')
          const temTarefa = diasComTarefa.has(key)
          const selecionado = isSameDay(dia, diaAtivo)
          const hoje = isToday(dia)
          return (
            <button
              key={key}
              onClick={() => { setDiaAtivo(dia); setMostraForm(false) }}
              className={cn(
                'aspect-square rounded-xl text-sm flex flex-col items-center justify-center gap-0.5 transition-colors',
                selecionado ? 'bg-indigo-600 text-white' :
                hoje ? 'border border-indigo-500 text-indigo-400' :
                'text-slate-400 hover:bg-slate-800'
              )}
            >
              {dia.getDate()}
              {temTarefa && <span className={cn('w-1 h-1 rounded-full', selecionado ? 'bg-white' : 'bg-indigo-400')} />}
            </button>
          )
        })}
      </div>

      {/* Lista do dia */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {isToday(diaAtivo) ? 'Hoje' : format(diaAtivo, "d 'de' MMMM", { locale: ptBR })}
          </h3>
          <div className="flex items-center gap-3">
            <button onClick={() => setVistaLista(true)} className="text-xs text-slate-500 hover:text-slate-300">Ver tudo</button>
            <button onClick={() => setMostraForm(!mostraForm)} className="text-xs text-indigo-400 flex items-center gap-1">
              <Plus size={14} /> Adicionar
            </button>
          </div>
        </div>

        {mostraForm && (
          <div className="mb-3 bg-slate-900 border border-slate-700 rounded-xl p-4 space-y-3">
            <input placeholder="Título" value={form.titulo} onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
              className="w-full bg-slate-800 text-sm text-slate-100 px-3 py-2 rounded-lg border border-slate-700 outline-none focus:border-indigo-500" />
            <input placeholder="Descrição (opcional)" value={form.descricao} onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
              className="w-full bg-slate-800 text-sm text-slate-100 px-3 py-2 rounded-lg border border-slate-700 outline-none focus:border-indigo-500" />
            <div className="grid grid-cols-2 gap-2">
              <input type="time" value={form.hora} onChange={(e) => setForm((f) => ({ ...f, hora: e.target.value }))}
                className="bg-slate-800 text-sm text-slate-100 px-3 py-2 rounded-lg border border-slate-700 outline-none focus:border-indigo-500" />
              <select value={form.tipo} onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value as Tarefa['tipo'] }))}
                className="bg-slate-800 text-sm text-slate-100 px-3 py-2 rounded-lg border border-slate-700 outline-none focus:border-indigo-500">
                <option value="reuniao">Reunião</option>
                <option value="tarefa">Tarefa</option>
                <option value="prazo">Prazo</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={salvar} className="flex-1 bg-indigo-600 text-white text-sm py-2 rounded-lg font-medium">Salvar</button>
              <button onClick={() => setMostraForm(false)} className="flex-1 bg-slate-800 text-slate-300 text-sm py-2 rounded-lg">Cancelar</button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {tarefasDoDia.length === 0 && !mostraForm && (
            <p className="text-xs text-slate-600 text-center py-6">Nenhuma tarefa para este dia</p>
          )}
          {[...tarefasDoDia].sort((a, b) => (a.hora ?? '99:99') > (b.hora ?? '99:99') ? 1 : -1)
            .map((t) => <TarefaItem key={t.id} tarefa={t} onToggle={toggleConcluida} onRemove={removeTarefa} onUpdate={updateTarefa} />)}
        </div>
      </section>
    </>
  )
}

// ─── ToDo ─────────────────────────────────────────────────────────────────────

function TodoList() {
  const { todos, addTodo, removeTodo, toggleTodo } = useStore()
  const [form, setForm] = useState({ titulo: '', prioridade: 'media' as Todo['prioridade'] })
  const [mostraForm, setMostraForm] = useState(false)
  const [filtro, setFiltro] = useState<'todos' | 'pendentes' | 'concluidos'>('pendentes')

  const salvar = () => {
    if (!form.titulo.trim()) return
    addTodo({ titulo: form.titulo.trim(), concluida: false, prioridade: form.prioridade })
    setForm({ titulo: '', prioridade: 'media' })
    setMostraForm(false)
  }

  const lista = todos.filter((t) => {
    if (filtro === 'pendentes') return !t.concluida
    if (filtro === 'concluidos') return t.concluida
    return true
  }).sort((a, b) => {
    const ord = { alta: 0, media: 1, baixa: 2 }
    if (a.concluida !== b.concluida) return a.concluida ? 1 : -1
    return ord[a.prioridade] - ord[b.prioridade]
  })

  const pendentes = todos.filter((t) => !t.concluida).length

  return (
    <section className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-200">Lista de Tarefas</h2>
          <p className="text-xs text-slate-500">{pendentes} pendente{pendentes !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setMostraForm(!mostraForm)} className="flex items-center gap-1 text-xs text-indigo-400">
          <Plus size={14} /> Nova
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-2">
        {(['pendentes', 'todos', 'concluidos'] as const).map((f) => (
          <button key={f} onClick={() => setFiltro(f)}
            className={cn('text-xs px-3 py-1.5 rounded-full border transition-colors capitalize',
              filtro === f ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-slate-700 text-slate-500')}>
            {f}
          </button>
        ))}
      </div>

      {/* Form */}
      {mostraForm && (
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 space-y-3">
          <input placeholder="O que precisa ser feito?" value={form.titulo}
            onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
            onKeyDown={(e) => e.key === 'Enter' && salvar()}
            className="w-full bg-slate-800 text-sm text-slate-100 px-3 py-2 rounded-lg border border-slate-700 outline-none focus:border-indigo-500" />
          <div className="flex gap-2">
            {(['alta', 'media', 'baixa'] as const).map((p) => {
              const pr = PRIORIDADE[p]
              return (
                <button key={p} onClick={() => setForm((f) => ({ ...f, prioridade: p }))}
                  className={cn('flex-1 flex items-center justify-center gap-1 text-xs py-1.5 rounded-lg border transition-colors',
                    form.prioridade === p ? pr.bg + ' ' + pr.cor : 'border-slate-700 text-slate-600')}>
                  <pr.icon size={11} />{pr.label}
                </button>
              )
            })}
          </div>
          <div className="flex gap-2">
            <button onClick={salvar} className="flex-1 bg-indigo-600 text-white text-sm py-2 rounded-lg font-medium">Salvar</button>
            <button onClick={() => setMostraForm(false)} className="flex-1 bg-slate-800 text-slate-300 text-sm py-2 rounded-lg">Cancelar</button>
          </div>
        </div>
      )}

      {/* Lista */}
      <div className="space-y-2">
        {lista.length === 0 && (
          <p className="text-xs text-slate-600 text-center py-8">
            {filtro === 'pendentes' ? 'Nenhuma tarefa pendente 🎉' : 'Nenhuma tarefa aqui'}
          </p>
        )}
        {lista.map((todo) => {
          const pr = PRIORIDADE[todo.prioridade]
          return (
            <div key={todo.id} className={cn('flex items-center gap-3 bg-slate-900 rounded-xl px-4 py-3 border border-slate-800', todo.concluida && 'opacity-50')}>
              <button onClick={() => toggleTodo(todo.id)} className="shrink-0">
                {todo.concluida ? <CheckCircle size={18} className="text-green-500" /> : <Circle size={18} className="text-slate-600" />}
              </button>
              <span className={cn('flex-1 text-sm', todo.concluida ? 'line-through text-slate-500' : 'text-slate-200')}>
                {todo.titulo}
              </span>
              <span className={cn('text-xs px-2 py-0.5 rounded-full border flex items-center gap-0.5 shrink-0', pr.bg, pr.cor)}>
                <pr.icon size={10} />{pr.label}
              </span>
              <button onClick={() => removeTodo(todo.id)} className="shrink-0 text-slate-700 hover:text-red-400 transition-colors">
                <Trash2 size={14} />
              </button>
            </div>
          )
        })}
      </div>
    </section>
  )
}

// ─── Estudos / Notas ──────────────────────────────────────────────────────────

function Estudos() {
  const { notas, addNota, updateNota, removeNota } = useStore()
  const [notaAberta, setNotaAberta] = useState<string | null>(null)
  const [criando, setCriando] = useState(false)
  const [filtroCategoria, setFiltroCategoria] = useState<'todos' | 'estudos' | 'geral'>('todos')
  const [form, setForm] = useState({ titulo: '', conteudo: '', categoria: 'estudos' as Nota['categoria'], tags: '' })

  const salvar = () => {
    if (!form.titulo.trim()) return
    addNota({
      titulo: form.titulo.trim(),
      conteudo: form.conteudo,
      categoria: form.categoria,
      tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
    })
    setForm({ titulo: '', conteudo: '', categoria: 'estudos', tags: '' })
    setCriando(false)
  }

  const lista = notas.filter((n) => filtroCategoria === 'todos' || n.categoria === filtroCategoria)
    .sort((a, b) => b.atualizadaEm.localeCompare(a.atualizadaEm))

  const notaEditando = notas.find((n) => n.id === notaAberta)

  if (notaAberta && notaEditando) {
    return <NotaEditor nota={notaEditando} onUpdate={updateNota} onClose={() => setNotaAberta(null)} onDelete={() => { removeNota(notaEditando.id); setNotaAberta(null) }} />
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-200">Notas & Estudos</h2>
          <p className="text-xs text-slate-500">{notas.length} nota{notas.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setCriando(!criando)} className="flex items-center gap-1 text-xs text-indigo-400">
          <Plus size={14} /> Nova nota
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-2">
        {([['todos', 'Todas'], ['estudos', 'Estudos'], ['geral', 'Geral']] as const).map(([id, label]) => (
          <button key={id} onClick={() => setFiltroCategoria(id)}
            className={cn('text-xs px-3 py-1.5 rounded-full border transition-colors',
              filtroCategoria === id ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-slate-700 text-slate-500')}>
            {label}
          </button>
        ))}
      </div>

      {/* Form de criação */}
      {criando && (
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 space-y-3">
          <input placeholder="Título da nota" value={form.titulo} onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
            className="w-full bg-slate-800 text-sm text-slate-100 px-3 py-2 rounded-lg border border-slate-700 outline-none focus:border-indigo-500" />
          <textarea placeholder="Conteúdo..." value={form.conteudo} onChange={(e) => setForm((f) => ({ ...f, conteudo: e.target.value }))} rows={4}
            className="w-full bg-slate-800 text-sm text-slate-100 px-3 py-2 rounded-lg border border-slate-700 outline-none focus:border-indigo-500 resize-none" />
          <div className="grid grid-cols-2 gap-2">
            <select value={form.categoria} onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value as Nota['categoria'] }))}
              className="bg-slate-800 text-sm text-slate-100 px-3 py-2 rounded-lg border border-slate-700 outline-none focus:border-indigo-500">
              <option value="estudos">Estudos</option>
              <option value="geral">Geral</option>
            </select>
            <input placeholder="Tags (vírgula)" value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
              className="bg-slate-800 text-sm text-slate-100 px-3 py-2 rounded-lg border border-slate-700 outline-none focus:border-indigo-500" />
          </div>
          <div className="flex gap-2">
            <button onClick={salvar} className="flex-1 bg-indigo-600 text-white text-sm py-2 rounded-lg font-medium">Salvar</button>
            <button onClick={() => setCriando(false)} className="flex-1 bg-slate-800 text-slate-300 text-sm py-2 rounded-lg">Cancelar</button>
          </div>
        </div>
      )}

      {/* Grid de notas */}
      {lista.length === 0 && (
        <p className="text-xs text-slate-600 text-center py-10">
          {filtroCategoria === 'estudos' ? 'Nenhuma nota de estudos' : 'Nenhuma nota aqui'}
        </p>
      )}
      <div className="space-y-2">
        {lista.map((nota) => (
          <button key={nota.id} onClick={() => setNotaAberta(nota.id)}
            className="w-full text-left bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 hover:border-indigo-500/50 transition-colors">
            <div className="flex items-start justify-between gap-2 mb-1">
              <p className="text-sm font-medium text-slate-200 leading-snug">{nota.titulo}</p>
              <span className={cn('shrink-0 text-xs px-1.5 py-0.5 rounded border',
                nota.categoria === 'estudos' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' : 'bg-slate-700/50 text-slate-400 border-slate-600/30')}>
                {nota.categoria}
              </span>
            </div>
            {nota.conteudo && (
              <p className="text-xs text-slate-500 line-clamp-2 mb-2">{nota.conteudo}</p>
            )}
            <div className="flex items-center justify-between">
              <div className="flex flex-wrap gap-1">
                {nota.tags.map((tag) => (
                  <span key={tag} className="text-xs text-indigo-400/70 bg-indigo-500/10 px-1.5 py-0.5 rounded">#{tag}</span>
                ))}
              </div>
              <span className="text-xs text-slate-600">{format(new Date(nota.atualizadaEm), "d MMM", { locale: ptBR })}</span>
            </div>
          </button>
        ))}
      </div>
    </section>
  )
}

// ─── Editor de nota ───────────────────────────────────────────────────────────

function NotaEditor({ nota, onUpdate, onClose, onDelete }: {
  nota: Nota
  onUpdate: (id: string, n: Partial<Nota>) => void
  onClose: () => void
  onDelete: () => void
}) {
  const [titulo, setTitulo] = useState(nota.titulo)
  const [conteudo, setConteudo] = useState(nota.conteudo)
  const [tags, setTags] = useState(nota.tags.join(', '))
  const [categoria, setCategoria] = useState(nota.categoria)

  function salvar() {
    onUpdate(nota.id, {
      titulo: titulo.trim() || nota.titulo,
      conteudo,
      categoria,
      tags: tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
    })
    onClose()
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <button onClick={onClose} className="text-slate-500 hover:text-slate-300"><ChevronLeft size={20} /></button>
        <span className="text-xs text-slate-500 flex-1">editando nota</span>
        <button onClick={onDelete} className="text-slate-700 hover:text-red-400 transition-colors"><Trash2 size={16} /></button>
        <button onClick={salvar} className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg font-medium flex items-center gap-1">
          <Check size={12} /> Salvar
        </button>
      </div>

      <input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Título"
        className="w-full bg-transparent text-lg font-bold text-slate-100 outline-none border-b border-slate-800 pb-2" />

      <textarea value={conteudo} onChange={(e) => setConteudo(e.target.value)} placeholder="Escreva aqui..."
        className="w-full bg-slate-900 text-sm text-slate-200 px-4 py-3 rounded-xl border border-slate-800 outline-none focus:border-indigo-500 resize-none leading-relaxed"
        rows={14} />

      <div className="grid grid-cols-2 gap-2">
        <select value={categoria} onChange={(e) => setCategoria(e.target.value as Nota['categoria'])}
          className="bg-slate-900 text-sm text-slate-100 px-3 py-2 rounded-xl border border-slate-800 outline-none">
          <option value="estudos">Estudos</option>
          <option value="geral">Geral</option>
        </select>
        <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="tags, separadas, por, vírgula"
          className="bg-slate-900 text-sm text-slate-400 px-3 py-2 rounded-xl border border-slate-800 outline-none focus:border-indigo-500" />
      </div>

      <p className="text-xs text-slate-600 text-right">
        Atualizado em {format(new Date(nota.atualizadaEm), "d MMM yyyy 'às' HH:mm", { locale: ptBR })}
      </p>
    </div>
  )
}

// ─── TarefaItem ───────────────────────────────────────────────────────────────

function TarefaItem({ tarefa, onToggle, onRemove, onUpdate, showDate }: {
  tarefa: Tarefa; onToggle: (id: string) => void; onRemove: (id: string) => void
  onUpdate: (id: string, t: Partial<Tarefa>) => void; showDate?: boolean
}) {
  const [editando, setEditando] = useState(false)
  const [titulo, setTitulo] = useState(tarefa.titulo)
  const [descricao, setDescricao] = useState(tarefa.descricao ?? '')
  const [hora, setHora] = useState(tarefa.hora ?? '')
  const [tipo, setTipo] = useState<Tarefa['tipo']>(tarefa.tipo)

  const salvar = () => {
    onUpdate(tarefa.id, { titulo: titulo.trim() || tarefa.titulo, descricao: descricao.trim() || undefined, hora: hora || undefined, tipo })
    setEditando(false)
  }

  const cancelar = () => {
    setTitulo(tarefa.titulo); setDescricao(tarefa.descricao ?? ''); setHora(tarefa.hora ?? ''); setTipo(tarefa.tipo)
    setEditando(false)
  }

  const tipoInfo = TIPO_TAREFA[tarefa.tipo]

  if (editando) {
    return (
      <div className="bg-slate-900 rounded-xl px-4 py-3 border border-indigo-600 space-y-2">
        <input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Título" className="w-full bg-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 outline-none border border-slate-700 focus:border-indigo-500" />
        <input value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Descrição (opcional)" className="w-full bg-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 outline-none border border-slate-700 focus:border-indigo-500" />
        <div className="flex gap-2">
          <input type="time" value={hora} onChange={e => setHora(e.target.value)} className="flex-1 bg-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 outline-none border border-slate-700 focus:border-indigo-500" />
          <select value={tipo} onChange={e => setTipo(e.target.value as Tarefa['tipo'])} className="flex-1 bg-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 outline-none border border-slate-700 focus:border-indigo-500">
            <option value="tarefa">Tarefa</option>
            <option value="reuniao">Reunião</option>
            <option value="prazo">Prazo</option>
          </select>
        </div>
        <div className="flex gap-2 pt-1">
          <button onClick={salvar} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg py-1.5 transition-colors">Salvar</button>
          <button onClick={cancelar} className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium rounded-lg py-1.5 transition-colors">Cancelar</button>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('flex items-start gap-3 bg-slate-900 rounded-xl px-4 py-3 border border-slate-800', tarefa.concluida && 'opacity-50')}>
      <button onClick={() => onToggle(tarefa.id)} className="shrink-0 mt-0.5">
        {tarefa.concluida ? <CheckCircle size={18} className="text-green-500" /> : <Circle size={18} className="text-slate-600" />}
      </button>
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm', tarefa.concluida ? 'line-through text-slate-500' : 'text-slate-200')}>{tarefa.titulo}</p>
        {tarefa.descricao && <p className="text-xs text-slate-500 mt-0.5">{tarefa.descricao}</p>}
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <span className={cn('text-xs px-2 py-0.5 rounded-full border', tipoInfo.bg, tipoInfo.cor)}>{tipoInfo.label}</span>
          {tarefa.hora && <span className="text-xs text-slate-500 flex items-center gap-1"><Clock size={11} />{tarefa.hora}</span>}
          {showDate && <span className="text-xs text-slate-500 flex items-center gap-1"><Calendar size={11} />{format(parseISO(tarefa.data), "d MMM", { locale: ptBR })}</span>}
        </div>
      </div>
      <button onClick={() => setEditando(true)} className="shrink-0 text-slate-500 hover:text-indigo-400 active:text-indigo-400 transition-colors">
        <Pencil size={15} />
      </button>
      <button onClick={() => onRemove(tarefa.id)} className="shrink-0 text-slate-700 hover:text-red-400 active:text-red-400 transition-colors">
        <Trash2 size={15} />
      </button>
    </div>
  )
}
