import { createLazyFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import React from 'react'
import { supabase } from '../lib/supabase'
import { UserPlus, Trash2, Search, User, Layers, X } from 'lucide-react'

export const Route = createLazyFileRoute('/turmas')({
  component: AlunosPage,
})

interface Turma {
  id: string
  nome: string
}

interface Aluno {
  id: string
  nome: string
  turma_id?: string
  turmas?: { nome: string }
}

function AlunosPage() {
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [turmas, setTurmas] = useState<Turma[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  const [nome, setNome] = useState('')
  const [turmaId, setTurmaId] = useState('')

  const fetchData = async () => {
    setLoading(true)
    
    // Buscar turmas para o select do modal
    const { data: turmasData } = await supabase.from('turmas').select('id, nome')
    setTurmas(turmasData || [])

    // Buscar alunos e fazer join com a tabela de turmas
    const { data, error } = await supabase
      .from('alunos')
      .select('*, turmas(nome)')
      .order('nome', { ascending: true })

    if (error) {
      console.error('Erro ao buscar alunos:', error.message)
    } else {
      setAlunos(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleCreateAluno = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nome.trim()) return

    const payload: any = { nome }
    if (turmaId) payload.turma_id = turmaId

    const { error } = await supabase
      .from('alunos')
      .insert([payload])

    if (error) {
      alert('Erro ao cadastrar aluno: ' + error.message)
    } else {
      setNome('')
      setTurmaId('')
      setIsModalOpen(false)
      fetchData()
    }
  }

  const handleDeleteAluno = async (id: string) => {
    if (!confirm('Deseja realmente excluir este aluno?')) return

    const { error } = await supabase
      .from('alunos')
      .delete()
      .eq('id', id)

    if (error) {
      alert('Erro ao excluir: ' + error.message)
    } else {
      setAlunos(alunos.filter((aluno) => aluno.id !== id))
    }
  }

  const filteredAlunos = alunos.filter((aluno) =>
    aluno.nome.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Gestão de Alunos</h1>
          <p className="text-gray-500 mt-1">Controle de estudantes por nome completo e turma.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-sm transition-all"
        >
          <UserPlus className="w-5 h-5" />
          Novo Aluno
        </button>
      </div>

      <div className="flex items-center bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm max-w-md">
        <Search className="w-5 h-5 text-gray-400 mr-3" />
        <input
          type="text"
          placeholder="Buscar por nome completo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-transparent outline-none text-gray-700 placeholder-gray-400"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Carregando alunos...</div>
      ) : filteredAlunos.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-12 text-center space-y-3">
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
                <th className="py-4 px-6">Turma</th>
                <th className="py-4 px-6 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
              {filteredAlunos.map((aluno) => (
                <tr key={aluno.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-4 px-6 font-medium text-gray-900 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                      {aluno.nome.substring(0, 2).toUpperCase()}
                    </div>
                    {aluno.nome}
                  </td>
                  <td className="py-4 px-6 text-gray-600">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 rounded-lg text-xs font-medium">
                      <Layers className="w-3.5 h-3.5 text-gray-500" />
                      {aluno.turmas?.nome || 'Sem turma vinculada'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button
                      onClick={() => handleDeleteAluno(aluno.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Excluir Aluno"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-6 relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b pb-4">
              <h2 className="text-xl font-bold text-gray-900">Cadastrar Novo Aluno</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAluno} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: João da Silva"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Turma</label>
                <select
                  value={turmaId}
                  onChange={(e) => setTurmaId(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm bg-white"
                >
                  <option value="">Selecione uma turma (opcional)</option>
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
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm transition-all"
                >
                  Salvar Aluno
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}