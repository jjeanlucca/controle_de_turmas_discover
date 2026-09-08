import { createLazyFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import React from 'react'
import { supabase } from '../lib/supabase'
import { CheckSquare, ClipboardList, Plus, Trash2, Search, X, Calendar, Layers, User, Save, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export const Route = createLazyFileRoute('/tarefas' as never)({
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

interface GradeRow {
  aluno_id: string;
  nome: string;
  entrega_id: string | null;
  status: string;
  nota: string | number;
}

function TarefasPage() {
  const [activeTab, setActiveTab] = useState<'atividades' | 'entregas'>('atividades')
  const [atividades, setAtividades] = useState<Atividade[]>([])
  const [turmas, setTurmas] = useState<Turma[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [prazo, setPrazo] = useState('')
  const [turmaId, setTurmaId] = useState('')

  const [selectedAtividadeId, setSelectedAtividadeId] = useState<string>('')
  const [gradesState, setGradesState] = useState<GradeRow[]>([])
  const [loadingGrades, setLoadingGrades] = useState(false)
  const [savingGrades, setSavingGrades] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    const { data: turmasData } = await supabase.from('turmas').select('id, nome').order('nome')
    setTurmas(turmasData || [])

    const { data: ativData } = await supabase
      .from('atividades')
      .select('*, turmas(nome)')
      .order('titulo', { ascending: true })
    setAtividades(ativData || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleCreateAtividade = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!titulo.trim()) return
    setSaving(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const payload: any = { titulo, descricao, professor_id: session?.user.id }
      if (turmaId) payload.turma_id = turmaId
      if (prazo) payload.prazo = prazo

      const { error } = await supabase.from('atividades').insert([payload])
      if (error) throw error

      toast.success('Atividade cadastrada com sucesso!')
      setTitulo('')
      setDescricao('')
      setPrazo('')
      setTurmaId('')
      setIsModalOpen(false)
      fetchData()
    } catch (error: any) {
      toast.error('Erro ao cadastrar: ' + (error.message || error))
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAtividade = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta atividade? As notas vinculadas também serão apagadas.')) return
    const { error } = await supabase.from('atividades').delete().eq('id', id)
    if (error) {
      toast.error('Erro ao excluir: ' + error.message)
    } else {
      toast.success('Atividade excluída.')
      setAtividades(atividades.filter((a) => a.id !== id))
      if (selectedAtividadeId === id) setSelectedAtividadeId('')
    }
  }

  const loadGradesForAtividade = async (atividadeId: string) => {
    setSelectedAtividadeId(atividadeId)
    if (!atividadeId) {
      setGradesState([])
      return
    }
    
    setLoadingGrades(true)
    const ativ = atividades.find(a => a.id === atividadeId)
    let alunosList: { id: string, nome: string }[] = []

    if (ativ?.turma_id) {
      const { data } = await supabase
        .from('turma_alunos')
        .select('alunos(id, nome)')
        .eq('turma_id', ativ.turma_id)
      if (data) alunosList = data.map((d: any) => d.alunos).filter(Boolean)
    } else {
      const { data } = await supabase.from('alunos').select('id, nome').order('nome')
      alunosList = data || []
    }

    const { data: entregasData } = await supabase
      .from('entregas')
      .select('*')
      .eq('atividade_id', atividadeId)

    // Lógica de Status Automático pelo Prazo
    let defaultStatus = 'Pendente'
    
    if (ativ?.prazo) {
      const prazoDate = new Date(ativ.prazo + 'T23:59:59')
      const hoje = new Date()
      
      if (hoje > prazoDate) {
        defaultStatus = 'Atrasado'
      }
    }

    const merged: GradeRow[] = alunosList.map(aluno => {
      const entrega = entregasData?.find(e => e.aluno_id === aluno.id)
      return {
        aluno_id: aluno.id,
        nome: aluno.nome,
        entrega_id: entrega?.id || null,
        status: entrega?.status || defaultStatus,
        nota: entrega?.nota !== null && entrega?.nota !== undefined ? entrega.nota : ''
      }
    }).sort((a, b) => a.nome.localeCompare(b.nome))

    setGradesState(merged)
    setLoadingGrades(false)
  }

  const handleGradeChange = (aluno_id: string, field: 'status' | 'nota', value: string) => {
    setGradesState(prev => prev.map(row => 
      row.aluno_id === aluno_id ? { ...row, [field]: value } : row
    ))
  }

 const handleSaveGrades = async () => {
    setSavingGrades(true)
    try {
      // Garantia extra: remove alunos duplicados caso o banco tenha registrado o mesmo aluno 2x na mesma turma
      const uniqueGrades = Array.from(new Map(gradesState.map(item => [item.aluno_id, item])).values())

      // Salva ou atualiza um por um rapidamente para não bugar os IDs do banco
      for (const row of uniqueGrades) {
        const payload = {
          atividade_id: selectedAtividadeId,
          aluno_id: row.aluno_id,
          status: row.status,
          nota: row.nota === '' ? null : Number(row.nota)
        }

        if (row.entrega_id) {
          // UPDATE: Atualiza a nota de quem já tinha registro (Sem enviar o ID dentro do payload)
          const { error } = await supabase
            .from('entregas')
            .update(payload)
            .eq('id', row.entrega_id)
            
          if (error) throw error
        } else {
          // INSERT: Cadastra a nota de quem não tinha registro
          const { error } = await supabase
            .from('entregas')
            .insert([payload])
            
          if (error) throw error
        }
      }

      toast.success('Notas e status salvos com sucesso!')
      loadGradesForAtividade(selectedAtividadeId) // Recarrega a tabela para atualizar os IDs internamente
    } catch (error: any) {
      toast.error('Erro ao salvar notas: ' + error.message)
    } finally {
      setSavingGrades(false)
    }
  }
  
  const filteredAtividades = atividades.filter((a) =>
    a.titulo.toLowerCase().includes(searchTerm.toLowerCase())
  ) 

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'Entregue': return 'bg-[#f3efff] text-[#6c47e6]'
      case 'Pendente': return 'bg-amber-50 text-amber-600'
      default: return 'bg-red-50 text-red-600'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50/60">
      <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">

        {/* Cabeçalho */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 pb-7 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#6c47e6] flex items-center justify-center shadow-sm shadow-[#6c47e6]/20 shrink-0">
              <ClipboardList className="w-6 h-6 text-white" strokeWidth={2} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Controle de Tarefas</h1>
              <p className="text-sm text-gray-500 mt-0.5">Gerencie as atividades escolares e lance as notas rapidamente</p>
            </div>
          </div>

          {activeTab === 'atividades' && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 bg-[#6c47e6] hover:bg-[#5533c7] active:bg-[#4a2bb0] text-white px-5 py-2.5 rounded-xl font-medium text-sm shadow-sm transition-colors self-start md:self-auto"
            >
              <Plus className="w-4 h-4" strokeWidth={2.5} />
              Nova atividade
            </button>
          )}
        </div>

        {/* Abas + busca */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1 h-11 w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('atividades')}
              className={`flex-1 sm:flex-none h-full px-6 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'atividades' ? 'bg-[#f3efff] text-[#6c47e6]' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Atividades ({atividades.length})
            </button>
            <button
              onClick={() => setActiveTab('entregas')}
              className={`flex-1 sm:flex-none h-full px-6 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'entregas' ? 'bg-[#f3efff] text-[#6c47e6]' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Entregas e notas
            </button>
          </div>

          {activeTab === 'atividades' && (
            <div className="relative w-full lg:w-80">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar atividade..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-11 bg-white border border-gray-200 rounded-xl pl-10 pr-4 outline-none focus:border-[#6c47e6] focus:ring-4 focus:ring-[#6c47e6]/10 transition-all text-sm placeholder:text-gray-400"
              />
            </div>
          )}
        </div>

        {/* Conteúdo */}
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-gray-400">
            <Loader2 className="w-7 h-7 animate-spin text-[#6c47e6]" />
            <p className="text-sm">Carregando dados...</p>
          </div>
        ) : activeTab === 'atividades' ? (
          filteredAtividades.length === 0 ? (
            <div className="bg-white border border-dashed border-gray-300 rounded-2xl py-20 px-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center mx-auto mb-4">
                <CheckSquare className="w-6 h-6 text-gray-300" />
              </div>
              <h3 className="text-base font-semibold text-gray-800">Nenhuma atividade encontrada</h3>
              <p className="text-gray-500 text-sm mt-1">Crie a primeira atividade para os alunos.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredAtividades.map((ativ) => (
                <div
                  key={ativ.id}
                  className="group bg-white border border-gray-200 rounded-2xl p-5 flex flex-col hover:border-gray-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="inline-flex items-center gap-1.5 bg-[#f3efff] text-[#6c47e6] text-[11px] font-medium px-2.5 py-1 rounded-md border border-[#e3d9ff]">
                      <Layers className="w-3 h-3" />
                      {ativ.turmas?.nome || 'Geral'}
                    </span>
                    <button
                      onClick={() => handleDeleteAtividade(ativ.id)}
                      className="text-gray-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <h3 className="font-semibold text-gray-900 mt-3">{ativ.titulo}</h3>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2 flex-1">
                    {ativ.descricao || 'Sem descrição informada.'}
                  </p>

                  {ativ.prazo && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 pt-4 mt-4 border-t border-gray-100">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      Prazo: {new Date(ativ.prazo + 'T12:00:00').toLocaleDateString('pt-BR')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-6">
            <div className="flex flex-col md:flex-row gap-4 md:items-end">
              <div className="flex-1 w-full">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">1. Selecione a atividade para correção</label>
                <select
                  value={selectedAtividadeId}
                  onChange={(e) => loadGradesForAtividade(e.target.value)}
                  className="w-full h-11 border border-gray-200 rounded-xl px-3.5 outline-none focus:border-[#6c47e6] focus:ring-4 focus:ring-[#6c47e6]/10 transition-all text-sm bg-white cursor-pointer"
                >
                  <option value="">Selecione uma atividade da lista...</option>
                  {atividades.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.titulo} {a.turmas ? ` (Turma: ${a.turmas.nome})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {selectedAtividadeId && gradesState.length > 0 && (
                <button
                  onClick={handleSaveGrades}
                  disabled={savingGrades}
                  className="inline-flex items-center justify-center gap-2 bg-[#6c47e6] hover:bg-[#5533c7] text-white px-5 py-2.5 rounded-xl font-medium text-sm shadow-sm transition-colors disabled:opacity-60 shrink-0 h-11"
                >
                  {savingGrades ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {savingGrades ? 'Salvando...' : 'Salvar todas as notas'}
                </button>
              )}
            </div>

            {loadingGrades ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-gray-400">
                <Loader2 className="w-6 h-6 animate-spin text-[#6c47e6]" />
                <p className="text-sm">Carregando lista de alunos...</p>
              </div>
            ) : selectedAtividadeId && gradesState.length === 0 ? (
              <div className="text-center py-16 text-gray-500 text-sm bg-gray-50 rounded-xl border border-dashed border-gray-300">
                Nenhum aluno encontrado para a turma desta atividade.
              </div>
            ) : selectedAtividadeId && gradesState.length > 0 ? (
              <div className="overflow-hidden border border-gray-200 rounded-xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs font-medium">
                      <th className="py-3.5 px-6">Aluno</th>
                      <th className="py-3.5 px-6 w-56">Status da entrega</th>
                      <th className="py-3.5 px-6 w-32">Nota</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                    {gradesState.map((row) => (
                      <tr key={row.aluno_id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="py-3 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#f3efff] text-[#6c47e6] flex items-center justify-center font-semibold text-xs shrink-0">
                              {row.nome.substring(0, 2).toUpperCase()}
                            </div>
                            <span className="font-medium text-gray-900">{row.nome}</span>
                          </div>
                        </td>
                        <td className="py-3 px-6">
                          <select
                            value={row.status}
                            onChange={(e) => handleGradeChange(row.aluno_id, 'status', e.target.value)}
                            className={`w-full border-0 rounded-lg px-3 py-2 outline-none text-sm font-medium transition-colors cursor-pointer appearance-none focus:ring-4 focus:ring-[#6c47e6]/10 ${getStatusStyles(row.status)}`}
                          >
                            <option value="Entregue">Entregue</option>
                            <option value="Pendente">Pendente</option>
                            <option value="Atrasado">Atrasado</option>
                          </select>
                        </td>
                        <td className="py-3 px-6">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            placeholder="-"
                            value={row.nota}
                            onChange={(e) => handleGradeChange(row.aluno_id, 'nota', e.target.value)}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#6c47e6] focus:ring-4 focus:ring-[#6c47e6]/10 transition-all text-sm text-center font-semibold text-gray-900 bg-white"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-gray-50 border border-dashed border-gray-300 rounded-2xl py-16 px-6 text-center">
                <div className="w-14 h-14 rounded-2xl bg-white border border-gray-200 flex items-center justify-center mx-auto mb-4">
                  <ClipboardList className="w-6 h-6 text-gray-300" />
                </div>
                <h3 className="text-base font-semibold text-gray-800">Planilha de correção</h3>
                <p className="text-gray-500 text-sm mt-1">Selecione uma atividade acima para carregar a lista de alunos e lançar as notas de forma rápida.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center px-6 py-5 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
              <h2 className="text-lg font-bold text-gray-900">Cadastrar nova atividade</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg transition-colors"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <form onSubmit={handleCreateAtividade} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Título da atividade</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Exercício prático de Flexbox"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-[#6c47e6] focus:ring-4 focus:ring-[#6c47e6]/10 transition-all text-sm bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Turma destinada</label>
                <select
                  value={turmaId}
                  onChange={(e) => setTurmaId(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-[#6c47e6] focus:ring-4 focus:ring-[#6c47e6]/10 transition-all text-sm bg-white cursor-pointer"
                >
                  <option value="">Geral (todas as turmas)</option>
                  {turmas.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Prazo de entrega</label>
                <input
                  type="date"
                  value={prazo}
                  onChange={(e) => setPrazo(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-[#6c47e6] focus:ring-4 focus:ring-[#6c47e6]/10 transition-all text-sm bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Descrição</label>
                <textarea
                  rows={3}
                  placeholder="Instruções para realizar a tarefa..."
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-[#6c47e6] focus:ring-4 focus:ring-[#6c47e6]/10 transition-all text-sm bg-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 text-sm font-medium bg-[#6c47e6] hover:bg-[#5533c7] text-white rounded-xl shadow-sm transition-colors flex items-center gap-2 disabled:opacity-60"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {saving ? 'Salvando...' : 'Salvar atividade'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}