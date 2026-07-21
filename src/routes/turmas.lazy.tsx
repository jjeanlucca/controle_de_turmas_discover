import { createLazyFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import React from 'react'
import { supabase } from '../lib/supabase'
import { Plus, X, Layers } from 'lucide-react'

export const Route = createLazyFileRoute('/turmas')({
  component: Turmas,
})

interface Turma {
  id: string
  nome: string
  ano_letivo: number
}

function Turmas() {
  const [turmas, setTurmas] = useState<Turma[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Campos do formulário de nova turma
  const [nome, setNome] = useState('')
  const [anoLetivo, setAnoLetivo] = useState(new Date().getFullYear())

  const fetchTurmas = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('turmas')
      .select('*')
      .order('nome', { ascending: true })

    if (error) {
      console.error('Erro ao buscar turmas:', error.message)
    } else {
      setTurmas(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchTurmas()
  }, [])

  // Cadastrar nova turma (Botão funcional)
  const handleCreateTurma = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nome.trim()) return

    const { error } = await supabase
      .from('turmas')
      .insert([{ nome, ano_letivo: Number(anoLetivo) }])

    if (error) {
      alert('Erro ao cadastrar turma: ' + error.message)
    } else {
      setNome('')
      setAnoLetivo(new Date().getFullYear())
      setIsModalOpen(false)
      fetchTurmas() // Atualiza a listagem na hora
    }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center border-b pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Controle de Turmas</h1>
          <p className="text-gray-500 mt-1">Gerencie as turmas e anos letivos da Escola Discover.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-sm transition-all"
        >
          <Plus className="w-5 h-5" />
          Nova Turma
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Buscando dados no servidor...</div>
      ) : turmas.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-12 text-center space-y-3">
          <Layers className="w-12 h-12 text-gray-300 mx-auto" />
          <h3 className="text-lg font-semibold text-gray-700">Nenhuma turma cadastrada ainda.</h3>
          <p className="text-gray-400 text-sm">Adicione uma turma clicando no botão acima.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {turmas.map((turma) => (
            <div key={turma.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{turma.nome}</h2>
                  <p className="text-xs text-gray-400">Ano Letivo: {turma.ano_letivo}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Cadastro de Turma */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-6 relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b pb-4">
              <h2 className="text-xl font-bold text-gray-900">Cadastrar Nova Turma</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTurma} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Turma *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Desenvolvimento Web - Turma A"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ano Letivo *</label>
                <input
                  type="number"
                  required
                  value={anoLetivo}
                  onChange={(e) => setAnoLetivo(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                />
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
                  Salvar Turma
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}