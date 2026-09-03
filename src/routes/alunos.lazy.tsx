import { createLazyFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import React from 'react'
import { supabase } from '../lib/supabase'
import { UserPlus, Trash2, Edit2, Search, User, Layers, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export const Route = createLazyFileRoute('/alunos' as never)({
  component: AlunosPage,
})

interface Turma {
  id: string
  nome: string
}

interface Aluno {
  id: string
  nome: string
  // Como é N:N, o aluno pode ter um array de turmas
  turmas: Turma[] 
}

function AlunosPage() {
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [turmas, setTurmas] = useState<Turma[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  
  // Controles do Modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  // Campos do Formulário
  const [nome, setNome] = useState('')
  const [turmaId, setTurmaId] = useState('')

  const fetchData = async () => {
    setLoading(true)
    
    // 1. Busca as turmas disponíveis para o <select>
    const { data: turmasData } = await supabase.from('turmas').select('id, nome').order('nome')
    setTurmas(turmasData || [])

    // 2. Busca os alunos e faz o JOIN profundo através da tabela N:N (turma_alunos)
    const { data, error } = await supabase
      .from('alunos')
      .select(`
        id, 
        nome,
        turma_alunos (
          turmas (id, nome)
        )
      `)
      .order('nome', { ascending: true })

    if (error) {
      toast.error('Erro ao buscar alunos: ' + error.message)
    } else if (data) {
      // Achata a resposta do Supabase para facilitar o uso na interface
      const alunosFormatados = data.map((aluno: any) => ({
        id: aluno.id,
        nome: aluno.nome,
        turmas: aluno.turma_alunos
          .map((ta: any) => ta.turmas)
          .filter(Boolean) // Remove nulos caso a turma tenha sido apagada
      }))
      
      setAlunos(alunosFormatados)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  // ==========================
  // SALVAR ALUNO (CREATE / UPDATE)
  // ==========================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nome.trim()) return
    setSaving(true)

    try {
      if (editingId) {
        // 1. Atualiza o nome do aluno na tabela principal
        const { error: updateError } = await supabase
          .from('alunos')
          .update({ nome })
          .eq('id', editingId)
          
        if (updateError) throw updateError

        // 2. Remove vínculos antigos deste aluno na tabela associativa
        await supabase.from('turma_alunos').delete().eq('aluno_id', editingId)

        // 3. Se uma turma foi selecionada no select, recria o vínculo
        if (turmaId) {
          const { error: linkError } = await supabase
            .from('turma_alunos')
            .insert([{ aluno_id: editingId, turma_id: turmaId }])
          if (linkError) throw linkError
        }

        toast.success('Aluno atualizado com sucesso!')
      } else {
        // 1. Cria o aluno novo na tabela principal e pega o ID dele
        const { data: novoAluno, error: insertError } = await supabase
          .from('alunos')
          .insert([{ nome, status: 'ativo' }])
          .select('id')
          .single()
          
        if (insertError) throw insertError

        // 2. Se uma turma foi selecionada, cria o vínculo na associativa
        if (turmaId && novoAluno) {
          const { error: linkError } = await supabase
            .from('turma_alunos')
            .insert([{ aluno_id: novoAluno.id, turma_id: turmaId }])
          if (linkError) throw linkError
        }

        toast.success('Aluno cadastrado com sucesso!')
      }

      closeModal()
      fetchData()
    } catch (error: any) {
      toast.error('Erro ao salvar: ' + (error.message || error))
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (aluno: Aluno) => {
    setEditingId(aluno.id)
    setNome(aluno.nome)
    // Se o aluno já estiver em uma turma, pega o ID da primeira turma dele
    setTurmaId(aluno.turmas.length > 0 ? aluno.turmas[0].id : '')
    setIsModalOpen(true)
  }

  const handleDeleteAluno = async (id: string) => {
    const ok = window.confirm('Deseja realmente excluir este aluno e todos os seus históricos?')
    if (!ok) return

    try {
      // Como o seu banco tem "on delete cascade", apagar o aluno aqui 
      // já apaga automaticamente as notas e vínculos na turma_alunos!
      const { error } = await supabase.from('alunos').delete().eq('id', id)
      if (error) throw error

      toast.success('Aluno excluído com sucesso.')
      setAlunos(alunos.filter((aluno) => aluno.id !== id))
    } catch (error: any) {
      toast.error('Erro ao excluir: ' + (error.message || error))
    }
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingId(null)
    setNome('')
    setTurmaId('')
  }

  const filteredAlunos = alunos.filter((aluno) =>
    aluno.nome.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      
      {/* CABEÇALHO */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Gestão de Alunos</h1>
          <p className="text-gray-500 mt-1">Controle de estudantes por nome completo e turma.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-[#6c47e6] hover:bg-[#5533c7] text-white px-5 py-2.5 rounded-xl font-medium shadow-sm transition-all"
        >
          <UserPlus className="w-5 h-5" />
          Novo Aluno
        </button>
      </div>

      {/* BUSCA */}
      <div className="flex items-center bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm max-w-md">
        <Search className="w-5 h-5 text-gray-400 mr-3 shrink-0" />
        <input
          type="text"
          placeholder="Buscar por nome completo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-transparent outline-none text-gray-700 placeholder-gray-400 text-sm"
        />
      </div>

      {/* LISTAGEM */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#6c47e6]" />
        </div>
      ) : filteredAlunos.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-12 text-center space-y-3 shadow-sm">
          <User className="w-12 h-12 text-gray-300 mx-auto" />
          <h3 className="text-lg font-semibold text-gray-700">Nenhum aluno encontrado</h3>
          <p className="text-gray-400 text-sm">Cadastre o primeiro aluno informando o nome e a turma.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 text-xs uppercase tracking-wider font-semibold">
                <th className="py-4 px-6">Nome Completo</th>
                <th className="py-4 px-6">Turma (Principal)</th>
                <th className="py-4 px-6 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
              {filteredAlunos.map((aluno) => (
                <tr key={aluno.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-4 px-6 font-medium text-gray-900 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#eeeaff] text-[#6c47e6] flex items-center justify-center font-bold text-xs shrink-0">
                      {aluno.nome.substring(0, 2).toUpperCase()}
                    </div>
                    {aluno.nome}
                  </td>
                  <td className="py-4 px-6 text-gray-600">
                    {aluno.turmas.length > 0 ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 rounded-lg text-xs font-medium">
                        <Layers className="w-3.5 h-3.5 text-gray-500" />
                        {aluno.turmas[0].nome}
                      </span>
                    ) : (
                      <span className="text-gray-400 italic text-xs">Sem turma vinculada</span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleEdit(aluno)}
                        className="p-2 text-gray-400 hover:text-[#6c47e6] hover:bg-[#eeeaff] rounded-lg transition-colors"
                        title="Editar Aluno"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteAluno(aluno.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir Aluno"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-6 relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b pb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {editingId ? 'Editar Aluno' : 'Cadastrar Novo Aluno'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: João da Silva"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#845ef7] focus:border-[#845ef7] text-sm transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vincular a uma Turma</label>
                <select
                  value={turmaId}
                  onChange={(e) => setTurmaId(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#845ef7] focus:border-[#845ef7] text-sm bg-white cursor-pointer transition-all"
                >
                  <option value="">Nenhuma turma (apenas cadastrar)</option>
                  {turmas.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-[#6c47e6] hover:bg-[#5533c7] text-white rounded-xl shadow-sm transition-all disabled:opacity-60"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {saving ? 'Salvando...' : (editingId ? 'Salvar Alterações' : 'Salvar Aluno')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}