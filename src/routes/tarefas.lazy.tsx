import { createLazyFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import React from 'react'
import { supabase } from '../lib/supabase'
import { CheckSquare, ClipboardList, Plus, Trash2, Search, X, Calendar, Layers, User } from 'lucide-react'

export const Route = createLazyFileRoute('/turmas')({
  component: TarefasPage,
})

interface Turma {
  id: string
  nome: string
}

interface Atividade {
  id: string
  titulo: string
  descricao?: string
  prazo?: string
  turma_id?: string
  turmas?: { nome: string }
}

interface Entrega {
  id: string
  atividade_id: string
  aluno_id: string
  status: string
  nota?: number
  atividades?: { titulo: string }
  alunos?: { nome: string }
}

function TarefasPage() {
  const [activeTab, setActiveTab] = useState<'atividades' | 'entregas'>('atividades')
  const [atividades, setAtividades] = useState<Atividade[]>([])
  const [entregas, setEntregas] = useState<Entrega[]>([])
  const [turmas, setTurmas] = useState<Turma[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Formulário de Nova Atividade
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [prazo, setPrazo] = useState('')
  const [turmaId, setTurmaId] = useState('')

  const fetchData = async () => {
    setLoading(true)

    // Buscar turmas para o select
    const { data: turmasData } = await supabase.from('turmas').select('id, nome')
    setTurmas(turmasData || [])

    // Buscar atividades com join em turmas
    const { data: ativData } = await supabase
      .from('atividades')
      .select('*, turmas(nome)')
      .order('titulo', { ascending: true })
    setAtividades(ativData || [])

    // Buscar entregas com join em atividades e alunos
    const { data: entData } = await supabase
      .from('entregas')
      .select('*, atividades(titulo), alunos(nome)')
    setEntregas(entData || [])

    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Cadastrar nova atividade
  const handleCreateAtividade = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!titulo.trim()) return

    const payload: any = { titulo, descricao, prazo }
    if (turmaId) payload.turma_id = turmaId

    const { error } = await supabase.from('atividades').insert([payload])

    if (error) {
      alert('Erro ao cadastrar atividade: ' + error.message)
    } else {
      setTitulo('')
      setDescricao('')
      setPrazo('')
      setTurmaId('')
      setIsModalOpen(false)
      fetchData()
    }
  }

  // Deletar atividade
  const handleDeleteAtividade = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta atividade?')) return

    const { error } = await supabase.from('atividades').delete().eq('id', id)
    if (error) {
      alert('Erro ao excluir: ' + error.message)
    } else {
      setAtividades(atividades.filter((a) => a.id !== id))
    }
  }

  const filteredAtividades = atividades.filter((a) =>
    a.titulo.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Controle de Tarefas</h1>
          <p className="text-gray-500 mt-1">Gerencie as atividades escolares e acompanhe as entregas dos alunos.</p>
        </div>
        {activeTab === 'atividades' && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-sm transition-all"
          >
            <Plus className="w-5 h-5" />
            Nova Atividade
          </button>
        )}
      </div>

      {/* Abas e Busca */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex bg-gray-100 p-1 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('atividades')}
            className={`flex-1 sm:flex-none px-6 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'atividades' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Atividades ({atividades.length})
          </button>
          <button
            onClick={() => setActiveTab('entregas')}
            className={`flex-1 sm:flex-none px-6 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'entregas' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Entregas e Notas ({entregas.length})
          </button>
        </div>

        {activeTab === 'atividades' && (
          <div className="flex items-center bg-white border border-gray-200 rounded-xl px-4 py-2 shadow-sm w-full sm:w-80">
            <Search className="w-4 h-4 text-gray-400 mr-3" />
            <input
              type="text"
              placeholder="Buscar atividade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent outline-none text-gray-700 text-sm placeholder-gray-400"
            />
          </div>
        )}
      </div>

      {/* Conteúdo condicional das Abas */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Carregando dados...</div>
      ) : activeTab === 'atividades' ? (
        filteredAtividades.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-12 text-center space-y-3">
            <CheckSquare className="w-12 h-12 text-gray-300 mx-auto" />
            <h3 className="text-lg font-semibold text-gray-700">Nenhuma atividade cadastrada</h3>
            <p className="text-gray-400 text-sm">Crie a primeira atividade para os alunos.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredAtividades.map((ativ) => (
              <div key={ativ.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-semibold">
                      <Layers className="w-3.5 h-3.5" /> {ativ.turmas?.nome || 'Geral'}
                    </span>
                    <button
                      onClick={() => handleDeleteAtividade(ativ.id)}
                      className="text-gray-400 hover:text-red-500 p-1 rounded-lg transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">{ativ.titulo}</h3>
                  <p className="text-sm text-gray-500 line-clamp-2">{ativ.descricao || 'Sem descrição informada.'}</p>
                </div>
                {ativ.prazo && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-400 pt-3 border-t">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    Prazo: {new Date(ativ.prazo).toLocaleDateString('pt-BR')}
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      ) : (
        entregas.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-12 text-center space-y-3">
            <ClipboardList className="w-12 h-12 text-gray-300 mx-auto" />
            <h3 className="text-lg font-semibold text-gray-700">Nenhuma entrega registrada</h3>
            <p className="text-gray-400 text-sm">As entregas dos alunos aparecerão aqui.</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 text-xs uppercase tracking-wider font-semibold">
                  <th className="py-4 px-6">Aluno</th>
                  <th className="py-4 px-6">Atividade</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">Nota</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                {entregas.map((ent) => (
                  <tr key={ent.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-6 font-medium text-gray-900 flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      {ent.alunos?.nome || 'Aluno não identificado'}
                    </td>
                    <td className="py-4 px-6 text-gray-600">{ent.atividades?.titulo || 'Atividade'}</td>
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium">
                        {ent.status || 'Pendente'}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-semibold text-gray-900">{ent.nota !== undefined ? ent.nota : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Modal de Nova Atividade */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-6 relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b pb-4">
              <h2 className="text-xl font-bold text-gray-900">Cadastrar Nova Atividade</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAtividade} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título da Atividade *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Exercício prático de Flexbox"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Turma Destinada</label>
                <select
                  value={turmaId}
                  onChange={(e) => setTurmaId(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white"
                >
                  <option value="">Selecione uma turma (opcional)</option>
                  {turmas.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prazo de Entrega</label>
                <input
                  type="date"
                  value={prazo}
                  onChange={(e) => setPrazo(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea
                  rows={3}
                  placeholder="Instruções para realizar a tarefa..."
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl">Cancelar</button>
                <button type="submit" className="px-5 py-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm">Salvar Atividade</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}