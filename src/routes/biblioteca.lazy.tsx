import { createLazyFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import React from 'react'
import { supabase } from '../lib/supabase'
import { BookOpen, FileText, Plus, Trash2, Search, X } from 'lucide-react'

// Path cast to any to satisfy route-typing in this project setup
export const Route = createLazyFileRoute('/biblioteca' as any)({
  component: BibliotecaPage,
})

interface PlanoAula {
  id: string
  titulo: string
  descricao?: string
  created_at?: string
}

interface Material {
  id: string
  titulo: string
  tipo?: string
  link?: string
  created_at?: string
}

function BibliotecaPage() {
  const [activeTab, setActiveTab] = useState<'planos' | 'materiais'>('planos')
  const [planos, setPlanos] = useState<PlanoAula[]>([])
  const [materiais, setMateriais] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Estados do formulário de Plano de Aula
  const [tituloPlano, setTituloPlano] = useState('')
  const [descricaoPlano, setDescricaoPlano] = useState('')

  // Estados do formulário de Material
  const [tituloMaterial, setTituloMaterial] = useState('')
  const [tipoMaterial, setTipoMaterial] = useState('PDF')
  const [linkMaterial, setLinkMaterial] = useState('')

  const fetchData = async () => {
    setLoading(true)
    const { data: planosData } = await supabase.from('planos_aula').select('*').order('titulo', { ascending: true })
    const { data: materiaisData } = await supabase.from('materiais').select('*').order('titulo', { ascending: true })
    
    setPlanos(planosData || [])
    setMateriais(materiaisData || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Cadastrar Plano de Aula
  const handleCreatePlano = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tituloPlano.trim()) return

    const { error } = await supabase.from('planos_aula').insert([{ titulo: tituloPlano, descricao: descricaoPlano }])
    if (error) {
      alert('Erro ao salvar plano de aula: ' + error.message)
    } else {
      setTituloPlano('')
      setDescricaoPlano('')
      setIsModalOpen(false)
      fetchData()
    }
  }

  // Cadastrar Material
  const handleCreateMaterial = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tituloMaterial.trim()) return

    const { error } = await supabase.from('materiais').insert([{ titulo: tituloMaterial, tipo: tipoMaterial, link: linkMaterial }])
    if (error) {
      alert('Erro ao salvar material: ' + error.message)
    } else {
      setTituloMaterial('')
      setTipoMaterial('PDF')
      setLinkMaterial('')
      setIsModalOpen(false)
      fetchData()
    }
  }

  // Deletar Plano de Aula
  const handleDeletePlano = async (id: string) => {
    if (!confirm('Deseja excluir este plano de aula?')) return
    const { error } = await supabase.from('planos_aula').delete().eq('id', id)
    if (error) alert('Erro ao excluir: ' + error.message)
    else setPlanos(planos.filter(p => p.id !== id))
  }

  // Deletar Material
  const handleDeleteMaterial = async (id: string) => {
    if (!confirm('Deseja excluir este material?')) return
    const { error } = await supabase.from('materiais').delete().eq('id', id)
    if (error) alert('Erro ao excluir: ' + error.message)
    else setMateriais(materiais.filter(m => m.id !== id))
  }

  const filteredPlanos = planos.filter(p => p.titulo.toLowerCase().includes(searchTerm.toLowerCase()))
  const filteredMateriais = materiais.filter(m => m.titulo.toLowerCase().includes(searchTerm.toLowerCase()))

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Biblioteca & Planejamento</h1>
          <p className="text-gray-500 mt-1">Gerencie planos de aula e materiais didáticos da Escola Discover.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-sm transition-all"
        >
          <Plus className="w-5 h-5" />
          {activeTab === 'planos' ? 'Novo Plano de Aula' : 'Novo Material'}
        </button>
      </div>

      {/* Abas e Barra de Pesquisa */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex bg-gray-100 p-1 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('planos')}
            className={`flex-1 sm:flex-none px-6 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'planos' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Planos de Aula ({planos.length})
          </button>
          <button
            onClick={() => setActiveTab('materiais')}
            className={`flex-1 sm:flex-none px-6 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'materiais' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Materiais Didáticos ({materiais.length})
          </button>
        </div>

        <div className="flex items-center bg-white border border-gray-200 rounded-xl px-4 py-2 shadow-sm w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 mr-3" />
          <input
            type="text"
            placeholder="Buscar por título..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent outline-none text-gray-700 text-sm placeholder-gray-400"
          />
        </div>
      </div>

      {/* Listagem baseada na aba ativa */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Carregando biblioteca...</div>
      ) : activeTab === 'planos' ? (
        filteredPlanos.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-12 text-center space-y-3">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto" />
            <h3 className="text-lg font-semibold text-gray-700">Nenhum plano de aula cadastrado</h3>
            <p className="text-gray-400 text-sm">Crie seu primeiro planejamento pedagógico.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredPlanos.map((plano) => (
              <div key={plano.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-semibold">
                      <BookOpen className="w-3.5 h-3.5" /> Plano de Aula
                    </span>
                    <button
                      onClick={() => handleDeletePlano(plano.id)}
                      className="text-gray-400 hover:text-red-500 p-1 rounded-lg transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">{plano.titulo}</h3>
                  <p className="text-sm text-gray-500 line-clamp-3">{plano.descricao || 'Sem descrição detalhada.'}</p>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        filteredMateriais.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-12 text-center space-y-3">
            <FileText className="w-12 h-12 text-gray-300 mx-auto" />
            <h3 className="text-lg font-semibold text-gray-700">Nenhum material cadastrado</h3>
            <p className="text-gray-400 text-sm">Adicione apostilas, slides ou links úteis.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredMateriais.map((mat) => (
              <div key={mat.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold">
                      <FileText className="w-3.5 h-3.5" /> {mat.tipo || 'Arquivo'}
                    </span>
                    <button
                      onClick={() => handleDeleteMaterial(mat.id)}
                      className="text-gray-400 hover:text-red-500 p-1 rounded-lg transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">{mat.titulo}</h3>
                  {mat.link && (
                    <a href={mat.link} target="_blank" rel="noreferrer" className="text-xs text-emerald-600 hover:underline block truncate">
                      Acessar link →
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Modal Dinâmico de Cadastro */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-6 relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b pb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {activeTab === 'planos' ? 'Novo Plano de Aula' : 'Novo Material Didático'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {activeTab === 'planos' ? (
              <form onSubmit={handleCreatePlano} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Título do Plano *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Introdução ao HTML5 e Semântica"
                    value={tituloPlano}
                    onChange={(e) => setTituloPlano(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descrição / Metodologia</label>
                  <textarea
                    rows={3}
                    placeholder="Descreva os objetivos e etapas..."
                    value={descricaoPlano}
                    onChange={(e) => setDescricaoPlano(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl">Cancelar</button>
                  <button type="submit" className="px-5 py-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm">Salvar Plano</button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleCreateMaterial} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Título do Material *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Apostila de CSS Grid"
                    value={tituloMaterial}
                    onChange={(e) => setTituloMaterial(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Material</label>
                  <select
                    value={tipoMaterial}
                    onChange={(e) => setTipoMaterial(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white"
                  >
                    <option value="PDF">PDF</option>
                    <option value="Slides">Slides</option>
                    <option value="Vídeo">Vídeo</option>
                    <option value="Link Útil">Link Útil</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Link ou URL</label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={linkMaterial}
                    onChange={(e) => setLinkMaterial(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl">Cancelar</button>
                  <button type="submit" className="px-5 py-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm">Salvar Material</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}