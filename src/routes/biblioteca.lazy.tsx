import { createLazyFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import React from "react";
import { supabase } from "../lib/supabase";
import { 
  BookOpen, Plus, X, Search, Trash2, 
  Link as LinkIcon, FileText, Code, Youtube, 
  ExternalLink, Layers, Loader2, Filter, BookMarked,
  ChevronDown, LayoutGrid, List
} from "lucide-react";
import { toast } from "sonner";

export const Route = createLazyFileRoute("/biblioteca" as never)({
  component: BibliotecaPage,
});

interface Turma {
  id: string;
  nome: string;
}

interface Material {
  id: string;
  titulo: string;
  descricao: string;
  tipo: 'link' | 'pdf' | 'snippet' | 'video';
  url_conteudo: string;
  turma_id: string | null;
  curso: string | null;
  turmas?: { nome: string };
  created_at: string;
}

// Catálogo Oficial da Escola Discover
const CATALOGO_CURSOS = {
  "Tecnologia": [
    "Programação de Games - Ano 01",
    "Programação de Games - Ano 02",
    "Games Starters",
    "Criação de Games",
    "Robótica - Ano 01",
    "Robótica - Ano 02",
    "Robótica Arduino",
    "Jornada Digital 1",
    "Jornada Digital 2",
    "Jornada Digital 1 - 2.0",
    "Jornada Digital 2 - 2.0"
  ],
  "Inglês e Geral": [
    "Beginners",
    "Starter's 1 Intro",
    "Starters 1",
    "Starters 2",
    "Adventure",
    "Discover Book Intro",
    "Discover Book 1",
    "Discover Book 2",
    "Discover Book 3",
    "Discover Book 4",
    "Discover Book 5",
    "StartUP 6",
    "Templates para apresentações",
    "Material Complementar"
  ]
};

function BibliotecaPage() {
  const [materiais, setMateriais] = useState<Material[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTipo, setFilterTipo] = useState("Todos");
  const [filterCurso, setFilterCurso] = useState("Todos");

  // Modo de visualização (apenas UI, não afeta dados)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Campos do Formulário
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [tipo, setTipo] = useState<'link' | 'pdf' | 'snippet' | 'video'>('link');
  const [urlConteudo, setUrlConteudo] = useState("");
  const [turmaId, setTurmaId] = useState("");
  const [cursoSelecionado, setCursoSelecionado] = useState("");

  const fetchData = async () => {
    setLoading(true);
    const { data: turmasData } = await supabase.from('turmas').select('id, nome').order('nome');
    setTurmas(turmasData || []);

    const { data: matData, error } = await supabase
      .from('materiais')
      .select('*, turmas(nome)')
      .order('created_at', { ascending: false });

    if (error) toast.error("Erro ao carregar biblioteca: " + error.message);
    else setMateriais(matData || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openModal = () => {
    setTitulo("");
    setDescricao("");
    setTipo('link');
    setUrlConteudo("");
    setTurmaId("");
    setCursoSelecionado("");
    setIsModalOpen(true);
  };

  const handleSaveMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || !urlConteudo.trim() || !cursoSelecionado) {
      toast.error("Preencha Título, Módulo/Curso e o Conteúdo!");
      return;
    }

    setSaving(true);
    const payload = {
      titulo,
      descricao,
      tipo,
      url_conteudo: urlConteudo,
      turma_id: turmaId ? turmaId : null,
      curso: cursoSelecionado
    };

    const { error } = await supabase.from('materiais').insert([payload]);

    if (error) {
      toast.error("Erro ao salvar: " + error.message);
    } else {
      toast.success("Material adicionado à biblioteca!");
      setIsModalOpen(false);
      fetchData();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Deseja realmente excluir este material?")) return;
    const { error } = await supabase.from('materiais').delete().eq('id', id);
    if (error) toast.error("Erro ao excluir: " + error.message);
    else {
      toast.success("Material excluído.");
      fetchData();
    }
  };

  const getTypeConfig = (tipo: string) => {
    switch(tipo) {
      case 'link': return { icon: LinkIcon, color: 'text-blue-600', bg: 'bg-blue-50', bar: 'bg-blue-500', label: 'Link Web' };
      case 'pdf': return { icon: FileText, color: 'text-red-600', bg: 'bg-red-50', bar: 'bg-red-500', label: 'Documento PDF' };
      case 'snippet': return { icon: Code, color: 'text-emerald-600', bg: 'bg-emerald-50', bar: 'bg-emerald-500', label: 'Código (Snippet)' };
      case 'video': return { icon: Youtube, color: 'text-rose-600', bg: 'bg-rose-50', bar: 'bg-rose-500', label: 'Vídeo Aula' };
      default: return { icon: BookOpen, color: 'text-gray-600', bg: 'bg-gray-50', bar: 'bg-gray-400', label: 'Material' };
    }
  };

  const materiaisFiltrados = materiais.filter(m => {
    const matchBusca = m.titulo.toLowerCase().includes(searchTerm.toLowerCase()) || 
                       (m.descricao && m.descricao.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchTipo = filterTipo === "Todos" || m.tipo === filterTipo;
    const matchCurso = filterCurso === "Todos" || m.curso === filterCurso;
    return matchBusca && matchTipo && matchCurso;
  });

  return (
    <div className="min-h-screen bg-gray-50/60">
      <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">

        {/* Cabeçalho */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 pb-7 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#6c47e6] flex items-center justify-center shadow-sm shadow-[#6c47e6]/20 shrink-0">
              <BookOpen className="w-6 h-6 text-white" strokeWidth={2} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Biblioteca Digital</h1>
              <p className="text-sm text-gray-500 mt-0.5">Acervo de apoio para os módulos oficiais da Escola Discover</p>
            </div>
          </div>
          <button
            onClick={openModal}
            className="inline-flex items-center justify-center gap-2 bg-[#6c47e6] hover:bg-[#5533c7] active:bg-[#4a2bb0] text-white px-5 py-2.5 rounded-xl font-medium text-sm shadow-sm transition-colors self-start md:self-auto"
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            Novo material
          </button>
        </div>

        {/* Barra de filtros */}
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por título ou descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-11 bg-white border border-gray-200 rounded-xl pl-10 pr-4 outline-none focus:border-[#6c47e6] focus:ring-4 focus:ring-[#6c47e6]/10 transition-all text-sm placeholder:text-gray-400"
            />
          </div>

          <div className="relative w-full lg:w-64">
            <BookMarked className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={filterCurso}
              onChange={(e) => setFilterCurso(e.target.value)}
              className="w-full h-11 appearance-none bg-white border border-gray-200 rounded-xl pl-10 pr-9 outline-none focus:border-[#6c47e6] focus:ring-4 focus:ring-[#6c47e6]/10 transition-all text-sm text-gray-700 cursor-pointer truncate"
            >
              <option value="Todos">Todos os módulos</option>
              <optgroup label="Tecnologia">
                {CATALOGO_CURSOS["Tecnologia"].map(c => <option key={c} value={c}>{c}</option>)}
              </optgroup>
              <optgroup label="Inglês e Geral">
                {CATALOGO_CURSOS["Inglês e Geral"].map(c => <option key={c} value={c}>{c}</option>)}
              </optgroup>
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <div className="relative w-full lg:w-48">
            <Filter className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={filterTipo}
              onChange={(e) => setFilterTipo(e.target.value)}
              className="w-full h-11 appearance-none bg-white border border-gray-200 rounded-xl pl-10 pr-9 outline-none focus:border-[#6c47e6] focus:ring-4 focus:ring-[#6c47e6]/10 transition-all text-sm text-gray-700 cursor-pointer"
            >
              <option value="Todos">Todos os tipos</option>
              <option value="link">Links web</option>
              <option value="pdf">Documentos PDF</option>
              <option value="snippet">Trechos de código</option>
              <option value="video">Vídeos</option>
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1 h-11 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              title="Visualização em grade"
              className={`h-full aspect-square flex items-center justify-center rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-[#f3efff] text-[#6c47e6]' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              title="Visualização em lista"
              className={`h-full aspect-square flex items-center justify-center rounded-lg transition-colors ${
                viewMode === 'list' ? 'bg-[#f3efff] text-[#6c47e6]' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Conteúdo */}
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-gray-400">
            <Loader2 className="w-7 h-7 animate-spin text-[#6c47e6]" />
            <p className="text-sm">Carregando materiais...</p>
          </div>
        ) : materiaisFiltrados.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-300 rounded-2xl py-20 px-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-6 h-6 text-gray-300" />
            </div>
            <h3 className="text-base font-semibold text-gray-800">Nenhum material encontrado</h3>
            <p className="text-gray-500 text-sm mt-1">Ajuste os filtros ou cadastre um novo material didático.</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {materiaisFiltrados.map((item) => {
              const config = getTypeConfig(item.tipo);
              const Icon = config.icon;

              return (
                <div
                  key={item.id}
                  className="group bg-white border border-gray-200 rounded-2xl overflow-hidden flex flex-col hover:border-gray-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                >
                  <div className={`h-1 ${config.bar}`} />

                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center shrink-0`}>
                        <Icon className={`w-5 h-5 ${config.color}`} strokeWidth={2} />
                      </div>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-gray-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <h3 className="font-semibold text-gray-900 mt-3 line-clamp-1" title={item.titulo}>
                      {item.titulo}
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">{config.label}</p>

                    {(item.curso || item.turma_id) && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {item.curso && (
                          <span className="inline-flex items-center bg-gray-100 text-gray-600 text-[11px] font-medium px-2 py-1 rounded-md">
                            {item.curso}
                          </span>
                        )}
                        {item.turma_id && (
                          <span className="inline-flex items-center gap-1 bg-[#f3efff] text-[#6c47e6] text-[11px] font-medium px-2 py-1 rounded-md border border-[#e3d9ff]">
                            <Layers className="w-3 h-3" />
                            {item.turmas?.nome}
                          </span>
                        )}
                      </div>
                    )}

                    <p className="text-sm text-gray-500 mt-3 line-clamp-2 flex-1">
                      {item.descricao || 'Sem descrição.'}
                    </p>

                    <div className="pt-4 mt-4 border-t border-gray-100">
                      {item.tipo === 'snippet' ? (
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(item.url_conteudo);
                            toast.success("Código copiado para a área de transferência!");
                          }}
                          className="w-full inline-flex justify-center items-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-700 py-2 rounded-xl text-sm font-medium transition-colors border border-gray-200"
                        >
                          <Code className="w-4 h-4" />
                          Copiar código
                        </button>
                      ) : (
                        <a
                          href={item.url_conteudo}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full inline-flex justify-center items-center gap-2 bg-[#f8f6ff] hover:bg-[#eeeaff] text-[#6c47e6] py-2 rounded-xl text-sm font-medium transition-colors"
                        >
                          Acessar {config.label.split(' ')[0]}
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden divide-y divide-gray-100">
            {materiaisFiltrados.map((item) => {
              const config = getTypeConfig(item.tipo);
              const Icon = config.icon;

              return (
                <div
                  key={item.id}
                  className="group flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/80 transition-colors"
                >
                  <span className={`w-1 self-stretch rounded-full ${config.bar} shrink-0`} />

                  <div className={`w-9 h-9 rounded-lg ${config.bg} flex items-center justify-center shrink-0`}>
                    <Icon className={`w-4.5 h-4.5 ${config.color}`} strokeWidth={2} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900 text-sm truncate" title={item.titulo}>
                        {item.titulo}
                      </h3>
                      {item.curso && (
                        <span className="inline-flex items-center bg-gray-100 text-gray-600 text-[11px] font-medium px-2 py-0.5 rounded-md shrink-0">
                          {item.curso}
                        </span>
                      )}
                      {item.turma_id && (
                        <span className="inline-flex items-center gap-1 bg-[#f3efff] text-[#6c47e6] text-[11px] font-medium px-2 py-0.5 rounded-md border border-[#e3d9ff] shrink-0">
                          <Layers className="w-3 h-3" />
                          {item.turmas?.nome}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {item.descricao || 'Sem descrição.'}
                    </p>
                  </div>

                  <div className="hidden sm:block text-xs text-gray-400 shrink-0 w-28 truncate">
                    {config.label}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {item.tipo === 'snippet' ? (
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(item.url_conteudo);
                          toast.success("Código copiado para a área de transferência!");
                        }}
                        className="inline-flex items-center gap-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border border-gray-200"
                      >
                        <Code className="w-3.5 h-3.5" />
                        Copiar
                      </button>
                    ) : (
                      <a
                        href={item.url_conteudo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 bg-[#f8f6ff] hover:bg-[#eeeaff] text-[#6c47e6] px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                      >
                        Acessar
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-gray-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center px-6 py-5 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
              <h2 className="text-lg font-bold text-gray-900">Novo material</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg transition-colors"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <form onSubmit={handleSaveMaterial} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Título do material</label>
                <input
                  type="text"
                  required
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ex: Componentes no React"
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-[#6c47e6] focus:ring-4 focus:ring-[#6c47e6]/10 transition-all text-sm bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Módulo / curso</label>
                <select
                  required
                  value={cursoSelecionado}
                  onChange={(e) => setCursoSelecionado(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-[#6c47e6] focus:ring-4 focus:ring-[#6c47e6]/10 transition-all text-sm bg-white cursor-pointer"
                >
                  <option value="" disabled>Selecione o módulo...</option>
                  <optgroup label="Tecnologia">
                    {CATALOGO_CURSOS["Tecnologia"].map(c => <option key={c} value={c}>{c}</option>)}
                  </optgroup>
                  <optgroup label="Inglês e Geral">
                    {CATALOGO_CURSOS["Inglês e Geral"].map(c => <option key={c} value={c}>{c}</option>)}
                  </optgroup>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo</label>
                  <select
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value as any)}
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-[#6c47e6] focus:ring-4 focus:ring-[#6c47e6]/10 transition-all text-sm bg-white cursor-pointer"
                  >
                    <option value="link">Link web</option>
                    <option value="pdf">Documento PDF</option>
                    <option value="snippet">Trecho de código</option>
                    <option value="video">Vídeo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Restringir à turma</label>
                  <select
                    value={turmaId}
                    onChange={(e) => setTurmaId(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-[#6c47e6] focus:ring-4 focus:ring-[#6c47e6]/10 transition-all text-sm bg-white cursor-pointer"
                  >
                    <option value="">Geral (todas as turmas)</option>
                    {turmas.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {tipo === 'snippet' ? 'Código' : 'URL do material'}
                </label>
                {tipo === 'snippet' ? (
                  <textarea
                    required
                    rows={4}
                    value={urlConteudo}
                    onChange={(e) => setUrlConteudo(e.target.value)}
                    placeholder="<div>Hello World</div>"
                    className="w-full font-mono text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-[#6c47e6] focus:ring-4 focus:ring-[#6c47e6]/10 transition-all bg-gray-50"
                  />
                ) : (
                  <input
                    type="url"
                    required
                    value={urlConteudo}
                    onChange={(e) => setUrlConteudo(e.target.value)}
                    placeholder="https://..."
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-[#6c47e6] focus:ring-4 focus:ring-[#6c47e6]/10 transition-all text-sm bg-white"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Descrição (opcional)</label>
                <textarea
                  rows={2}
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
                  Salvar material
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}