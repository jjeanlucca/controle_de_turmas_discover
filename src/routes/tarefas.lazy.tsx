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
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Controle de Tarefas</h1>
          <p className="text-gray-500 mt-1">Gerencie as atividades escolares e lance as notas rapidamente.</p>
        </div>
        
        {activeTab === 'atividades' && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-[#6c47e6] hover:bg-[#5533c7] text-white px-5 py-2.5 rounded-xl font-medium shadow-sm transition-all"
          >
            <Plus className="w-5 h-5" />
            Nova Atividade
          </button>
        )}
      </div>

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
            Entregas e Notas
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

      {loading ? (
        <div className="text-center py-12 text-gray-500">Carregando dados...</div>
      ) : activeTab === 'atividades' ? (
        filteredAtividades.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-12 text-center space-y-3">
            <CheckSquare className="w-12 h-12 text-gray-300 mx-auto" />
            <h3 className="text-lg font-semibold text-gray-700">Nenhuma atividade encontrada</h3>
            <p className="text-gray-400 text-sm">Crie a primeira atividade para os alunos.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredAtividades.map((ativ) => (
              <div key={ativ.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#eeeaff] text-[#6c47e6] rounded-lg text-xs font-semibold">
                      <Layers className="w-3.5 h-3.5" /> {ativ.turmas?.nome || 'Geral'}
                    </span>
                    <button
                      onClick={() => handleDeleteAtividade(ativ.id)}
                      className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">{ativ.titulo}</h3>
                  <p className="text-sm text-gray-500 line-clamp-2">{ativ.descricao || 'Sem descrição informada.'}</p>
                </div>
                {ativ.prazo && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 pt-3 border-t">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    Prazo: {new Date(ativ.prazo + 'T12:00:00').toLocaleDateString('pt-BR')}
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-6">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">1. Selecione a Atividade para Correção</label>
              <select
                value={selectedAtividadeId}
                onChange={(e) => loadGradesForAtividade(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#845ef7] text-sm bg-white cursor-pointer"
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
                className="flex items-center gap-2 bg-[#6c47e6] hover:bg-[#5533c7] text-white px-6 py-2.5 rounded-xl font-medium shadow-sm transition-all disabled:opacity-60 shrink-0 h-[42px]"
              >
                {savingGrades ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                {savingGrades ? 'Salvando...' : 'Salvar Todas as Notas'}
              </button>
            )}
          </div>

          {loadingGrades ? (
            <div className="py-12 flex justify-center items-center gap-3 text-gray-500">
              <Loader2 className="w-6 h-6 animate-spin text-[#6c47e6]" />
              Carregando lista de alunos...
            </div>
          ) : selectedAtividadeId && gradesState.length === 0 ? (
            <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl border border-dashed">
              Nenhum aluno encontrado para a turma desta atividade.
            </div>
          ) : selectedAtividadeId && gradesState.length > 0 ? (
            <div className="overflow-hidden border border-gray-200 rounded-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 text-xs uppercase tracking-wider font-semibold">
                    <th className="py-4 px-6">Aluno</th>
                    <th className="py-4 px-6 w-56">Status da Entrega</th>
                    <th className="py-4 px-6 w-32">Nota</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                  {gradesState.map((row) => (
                    <tr key={row.aluno_id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 px-6 font-medium text-gray-900 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#eeeaff] text-[#6c47e6] flex items-center justify-center font-bold text-xs shrink-0">
                          {row.nome.substring(0, 2).toUpperCase()}
                        </div>
                        {row.nome}
                      </td>
                      <td className="py-3 px-6">
                        <select
                          value={row.status}
                          onChange={(e) => handleGradeChange(row.aluno_id, 'status', e.target.value)}
                          className={`w-full border rounded-lg px-3 py-2 outline-none text-sm font-semibold transition-colors cursor-pointer appearance-none ${
                            row.status === 'Entregue' ? 'bg-[#eeeaff] text-[#6c47e6] border-transparent' :
                            row.status === 'Pendente' ? 'bg-amber-50 text-amber-600 border-transparent' :
                            'bg-red-50 text-red-600 border-transparent'
                          }`}
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
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#845ef7] text-sm text-center font-bold text-gray-900 bg-white"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-gray-50 border border-dashed border-gray-300 rounded-2xl p-12 text-center space-y-3">
              <ClipboardList className="w-12 h-12 text-gray-300 mx-auto" />
              <h3 className="text-lg font-semibold text-gray-700">Planilha de Correção</h3>
              <p className="text-gray-400 text-sm">Selecione uma atividade acima para carregar a lista de alunos e lançar as notas de forma rápida.</p>
            </div>
          )}
        </div>
      )}

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
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#845ef7] text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Turma Destinada</label>
                <select
                  value={turmaId}
                  onChange={(e) => setTurmaId(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#845ef7] text-sm bg-white"
                >
                  <option value="">Geral (Todas as turmas)</option>
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
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#845ef7] text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea
                  rows={3}
                  placeholder="Instruções para realizar a tarefa..."
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#845ef7] text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={saving}
                  className="px-5 py-2 text-sm font-medium bg-[#6c47e6] hover:bg-[#5533c7] text-white rounded-xl shadow-sm transition-all disabled:opacity-60"
                >
                  {saving ? 'Salvando...' : 'Salvar Atividade'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}