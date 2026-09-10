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
    <div className="min-h-screen bg-gray-50/60">
      <div className="p-4 sm:p-6 md:p-10 max-w-7xl mx-auto space-y-6 md:space-y-8">

        {/* Cabeçalho */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 md:pb-7 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#3e4095] flex items-center justify-center shadow-sm shadow-[#3e4095]/20 shrink-0">
              <User className="w-6 h-6 text-white" strokeWidth={2} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Gestão de Alunos</h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Controle de estudantes por nome completo e turma</p>
            </div>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full md:w-auto inline-flex items-center justify-center gap-2 bg-[#3e4095] hover:bg-[#32346e] active:bg-[#282a58] text-white px-5 py-2.5 rounded-xl font-medium text-sm shadow-sm transition-colors"
          >
            <UserPlus className="w-4 h-4" strokeWidth={2.5} />
            Novo aluno
          </button>
        </div>

        {/* Busca */}
        <div className="relative w-full md:max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por nome completo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-11 bg-white border border-gray-200 rounded-xl pl-10 pr-4 outline-none focus:border-[#3e4095] focus:ring-4 focus:ring-[#3e4095]/10 transition-all text-sm placeholder:text-gray-400"
          />
        </div>

        {/* Listagem */}
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-gray-400">
            <Loader2 className="w-7 h-7 animate-spin text-[#3e4095]" />
            <p className="text-sm">Carregando alunos...</p>
          </div>
        ) : filteredAlunos.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-300 rounded-2xl py-12 md:py-20 px-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center mx-auto mb-4">
              <User className="w-6 h-6 text-gray-300" />
            </div>
            <h3 className="text-base font-semibold text-gray-800">Nenhum aluno encontrado</h3>
            <p className="text-gray-500 text-sm mt-1">Cadastre o primeiro aluno informando o nome e a turma.</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            {/* Wrapper para rolagem horizontal no celular */}
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[550px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs font-medium">
                    <th className="py-3.5 px-4 sm:px-6">Nome completo</th>
                    <th className="py-3.5 px-4 sm:px-6">Turma (principal)</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                  {filteredAlunos.map((aluno) => (
                    <tr key={aluno.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#eceafb] text-[#3e4095] flex items-center justify-center font-semibold text-xs shrink-0">
                            {aluno.nome.substring(0, 2).toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-900 whitespace-nowrap">{aluno.nome}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 sm:px-6">
                        {aluno.turmas.length > 0 ? (
                          <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-600 px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap">
                            <Layers className="w-3.5 h-3.5 shrink-0" />
                            {aluno.turmas[0].nome}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic text-xs whitespace-nowrap">Sem turma</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleEdit(aluno)}
                            className="p-2 text-gray-400 hover:text-[#3e4095] hover:bg-[#eceafb] rounded-lg transition-colors"
                            title="Editar aluno"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteAluno(aluno.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Excluir aluno"
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
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
              <h2 className="text-lg font-bold text-gray-900">
                {editingId ? 'Editar aluno' : 'Cadastrar novo aluno'}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome completo</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: João da Silva"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-[#3e4095] focus:ring-4 focus:ring-[#3e4095]/10 transition-all text-sm bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Vincular a uma turma</label>
                <select
                  value={turmaId}
                  onChange={(e) => setTurmaId(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-[#3e4095] focus:ring-4 focus:ring-[#3e4095]/10 transition-all text-sm bg-white cursor-pointer"
                >
                  <option value="">Nenhuma turma (apenas cadastrar)</option>
                  {turmas.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nome}
                    </option>
                  ))}
                </select>
              </div>

              {/* Botões ajustados para mobile: empilhados invertidos no celular e lado a lado no desktop */}
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 sm:pt-2 border-t sm:border-t-0 border-gray-100 mt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors text-center"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium bg-[#3e4095] hover:bg-[#32346e] text-white rounded-xl shadow-sm transition-colors disabled:opacity-60"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {saving ? 'Salvando...' : (editingId ? 'Salvar alterações' : 'Salvar aluno')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}