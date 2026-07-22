import { createLazyFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import React from 'react'
import { supabase } from '../lib/supabase'
import { BookOpen, Plus, Trash2, Edit2, Search, X, Layers, Gamepad2, Share2 } from 'lucide-react'

export const Route = createLazyFileRoute('/biblioteca' as any)({
  component: BibliotecaPage,
})

interface Conteudo {
  id: string
  modulo: string
  materia: string
  numero_aula: number
  nome_aula: string
  link_livro?: string
  link_jogo?: string
  tarefa_casa?: string
}

function BibliotecaPage() {
  const [conteudos, setConteudos] = useState<Conteudo[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Estados do Formulário
  const [modulo, setModulo] = useState('')
  const [materia, setMateria] = useState('')
  const [numeroAula, setNumeroAula] = useState<number | ''>('')
  const [nomeAula, setNomeAula] = useState('')
  const [linkLivro, setLinkLivro] = useState('')
  const [linkJogo, setLinkJogo] = useState('')
  const [tarefaCasa, setTarefaCasa] = useState('')

  const fetchConteudos = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('biblioteca_conteudos')
      .select('*')
      .order('modulo', { ascending: true })
      .order('materia', { ascending: true })
      .order('numero_aula', { ascending: true })

    if (error) {
      console.error('Erro ao buscar biblioteca:', error.message)
    } else {
      setConteudos(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchConteudos()
  }, [])

  // Salvar (Create ou Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!modulo.trim() || !materia.trim() || !nomeAula.trim() || numeroAula === '') return

    const payload = {
      modulo,
      materia,
      numero_aula: Number(numeroAula),
      nome_aula: nomeAula,
      link_livro: linkLivro,
      link_jogo: linkJogo,
      tarefa_casa: tarefaCasa,
    }

    if (editingId) {
      const { error } = await supabase
        .from('biblioteca_conteudos')
        .update(payload)
        .eq('id', editingId)

      if (error) alert('Erro ao atualizar: ' + error.message)
      else {
        closeModal()
        fetchConteudos()
      }
    } else {
      const { error } = await supabase
        .from('biblioteca_conteudos')
        .insert([payload])

      if (error) alert('Erro ao cadastrar: ' + error.message)
      else {
        closeModal()
        fetchConteudos()
      }
    }
  }

  const handleEdit = (item: Conteudo) => {
    setEditingId(item.id)
    setModulo(item.modulo)
    setMateria(item.materia)
    setNumeroAula(item.numero_aula)
    setNomeAula(item.nome_aula)
    setLinkLivro(item.link_livro || '')
    setLinkJogo(item.link_jogo || '')
    setTarefaCasa(item.tarefa_casa || '')
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir este conteúdo da biblioteca?')) return
    const { error } = await supabase.from('biblioteca_conteudos').delete().eq('id', id)
    if (error) alert('Erro ao excluir: ' + error.message)
    else setConteudos(conteudos.filter((c) => c.id !== id))
  }

  // 📲 Função mágica para disparar mensagem pronta no WhatsApp
  const handleShareWhatsApp = (item: Conteudo) => {
    const mensagem = encodeURIComponent(
      `📚 *Escola Discover - Conteúdo da Aula*\n\n` +
      `📦 *Módulo:* ${item.modulo}\n` +
      `💻 *Matéria:* ${item.materia} - *Aula ${item.numero_aula}:* ${item.nome_aula}\n\n` +
      (item.link_livro ? `📖 *Livro Digital:* ${item.link_livro}\n` : '') +
      (item.link_jogo ? `🎮 *Jogo Interativo:* ${item.link_jogo}\n` : '') +
      (item.tarefa_casa ? `📝 *Dever de Casa:* ${item.tarefa_casa}\n` : '') +
      `\n_Bons estudos! Dúvidas, mandem aqui no grupo._`
    )
    window.open(`https://api.whatsapp.com/send?text=${mensagem}`, '_blank')
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingId(null)
    setModulo('')
    setMateria('')
    setNumeroAula('')
    setNomeAula('')
    setLinkLivro('')
    setLinkJogo('')
    setTarefaCasa('')
  }

  const filteredConteudos = conteudos.filter(
    (c) =>
      c.nome_aula.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.materia.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.modulo.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Biblioteca de Conteúdo & Aulas</h1>
          <p className="text-gray-500 mt-1">Gerencie a trilha pedagógica, livros digitais, jogos e envie links direto no WhatsApp.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-sm transition-all"
        >
          <Plus className="w-5 h-5" />
          Novo Conteúdo
        </button>
      </div>

      {/* Pesquisa */}
      <div className="flex items-center bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm max-w-md">
        <Search className="w-5 h-5 text-gray-400 mr-3" />
        <input
          type="text"
          placeholder="Buscar por módulo, matéria ou aula..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-transparent outline-none text-gray-700 placeholder-gray-400 text-sm"
        />
      </div>

      {/* Listagem */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Carregando biblioteca...</div>
      ) : filteredConteudos.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-12 text-center space-y-3">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto" />
          <h3 className="text-lg font-semibold text-gray-700">Nenhum conteúdo cadastrado</h3>
          <p className="text-gray-400 text-sm">Adicione sua primeira aula clicando no botão acima.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredConteudos.map((item) => (
            <div
              key={item.id}
              className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow flex flex-col justify-between space-y-5"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-semibold">
                    <Layers className="w-3.5 h-3.5" /> {item.modulo}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEdit(item)}
                      className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{item.materia}</span>
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mt-1">
                    <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-extrabold">
                      {item.numero_aula}
                    </span>
                    {item.nome_aula}
                  </h3>
                </div>

                {item.tarefa_casa && (
                  <p className="text-xs text-gray-500 bg-gray-50 p-3 rounded-xl border border-gray-100 line-clamp-2">
                    <span className="font-semibold text-gray-700">Dever:</span> {item.tarefa_casa}
                  </p>
                )}
              </div>

              {/* Links e Botão WhatsApp */}
              <div className="pt-4 border-t space-y-2">
                <div className="flex items-center gap-3 text-xs">
                  {item.link_livro && (
                    <a href={item.link_livro} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-emerald-600 hover:underline font-medium">
                      <BookOpen className="w-3.5 h-3.5" /> Livro
                    </a>
                  )}
                  {item.link_jogo && (
                    <a href={item.link_jogo} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline font-medium">
                      <Gamepad2 className="w-3.5 h-3.5" /> Jogo
                    </a>
                  )}
                </div>

                <button
                  onClick={() => handleShareWhatsApp(item)}
                  className="w-full mt-2 flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 px-4 py-2.5 rounded-xl font-semibold text-xs transition-colors border border-emerald-200"
                >
                  <Share2 className="w-4 h-4 text-emerald-600" />
                  Compartilhar no WhatsApp
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Cadastro / Edição */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-6 relative max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {editingId ? 'Editar Aula da Biblioteca' : 'Cadastrar Nova Aula'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Módulo / Livro *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Módulo 1 - Informática Fundamental"
                  value={modulo}
                  onChange={(e) => setModulo(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Matéria / Software *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Excel, Word..."
                    value={materia}
                    onChange={(e) => setMateria(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nº Aula *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    placeholder="Ex: 3"
                    value={numeroAula}
                    onChange={(e) => setNumeroAula(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Aula *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Fórmulas Básicas e SOMA"
                  value={nomeAula}
                  onChange={(e) => setNomeAula(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Link do Livro Digital (URL)</label>
                <input
                  type="text"
                  placeholder="https://discover.app/livro/..."
                  value={linkLivro}
                  onChange={(e) => setLinkLivro(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Link do Jogo / Interatividade (URL)</label>
                <input
                  type="text"
                  placeholder="https://discover.app/jogos/..."
                  value={linkJogo}
                  onChange={(e) => setLinkJogo(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dever de Casa / Instruções</label>
                <textarea
                  rows={2}
                  placeholder="O que o aluno deve fazer..."
                  value={tarefaCasa}
                  onChange={(e) => setTarefaCasa(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                />
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
                  className="px-5 py-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm transition-all"
                >
                  {editingId ? 'Salvar Alterações' : 'Salvar Conteúdo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}