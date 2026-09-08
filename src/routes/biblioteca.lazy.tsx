import { createLazyFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import React from "react";
import { supabase } from "../lib/supabase";
import { 
  BookOpen, Plus, X, Search, Trash2, 
  Link as LinkIcon, FileText, Code, Youtube, 
  ExternalLink, Layers, Loader2, Filter, BookMarked
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
      case 'link': return { icon: LinkIcon, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Link Web' };
      case 'pdf': return { icon: FileText, color: 'text-red-600', bg: 'bg-red-50', label: 'Documento PDF' };
      case 'snippet': return { icon: Code, color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Código (Snippet)' };
      case 'video': return { icon: Youtube, color: 'text-rose-600', bg: 'bg-rose-50', label: 'Vídeo Aula' };
      default: return { icon: BookOpen, color: 'text-gray-600', bg: 'bg-gray-50', label: 'Material' };
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
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Biblioteca Digital</h1>
          <p className="text-gray-500 mt-1">Acervo de apoio para os módulos oficiais da Escola Discover.</p>
        </div>
        <button
          onClick={openModal}
          className="flex items-center gap-2 bg-[#6c47e6] hover:bg-[#5533c7] text-white px-5 py-2.5 rounded-xl font-medium shadow-sm transition-all"
        >
          <Plus className="w-5 h-5" />
          Novo Material
        </button>
      </div>

      {/* BARRA DE FILTROS APRIMORADA */}
      <div className="flex flex-col lg:flex-row items-center gap-4 bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
        <div className="relative w-full lg:flex-1">
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar material..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 outline-none focus:bg-white focus:ring-2 focus:ring-[#845ef7] transition-all text-sm"
          />
        </div>
        
        <div className="relative w-full lg:w-64">
          <BookMarked className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <select
            value={filterCurso}
            onChange={(e) => setFilterCurso(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 outline-none focus:bg-white focus:ring-2 focus:ring-[#845ef7] transition-all text-sm cursor-pointer appearance-none truncate"
          >
            <option value="Todos">Todos os Módulos</option>
            <optgroup label="Tecnologia">
              {CATALOGO_CURSOS["Tecnologia"].map(c => <option key={c} value={c}>{c}</option>)}
            </optgroup>
            <optgroup label="Inglês e Geral">
              {CATALOGO_CURSOS["Inglês e Geral"].map(c => <option key={c} value={c}>{c}</option>)}
            </optgroup>
          </select>
        </div>

        <div className="relative w-full lg:w-48">
          <Filter className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <select
            value={filterTipo}
            onChange={(e) => setFilterTipo(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 outline-none focus:bg-white focus:ring-2 focus:ring-[#845ef7] transition-all text-sm cursor-pointer appearance-none"
          >
            <option value="Todos">Todos os Tipos</option>
            <option value="link">Links Web</option>
            <option value="pdf">Documentos PDF</option>
            <option value="snippet">Trechos de Código</option>
            <option value="video">Vídeos</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#6c47e6]" />
        </div>
      ) : materiaisFiltrados.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-16 text-center space-y-4">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto" />
          <h3 className="text-lg font-bold text-gray-700">Nenhum material encontrado</h3>
          <p className="text-gray-500 text-sm">Ajuste os filtros ou cadastre um novo material didático.</p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {materiaisFiltrados.map((item) => {
            const config = getTypeConfig(item.tipo);
            const Icon = config.icon;
            
            return (
              <div key={item.id} className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col hover:shadow-md transition-shadow group relative mt-3">
                
                {/* Curso / Módulo Badge */}
                {item.curso && (
                  <div className="absolute -top-3 left-4 bg-gray-900 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-sm">
                    {item.curso}
                  </div>
                )}

                {/* Turma Restrita Badge (Se houver) */}
                {item.turma_id && (
                  <div className="absolute -top-3 right-4 bg-[#eeeaff] text-[#6c47e6] text-[10px] font-bold px-2 py-1 rounded-md border border-[#d5ccff] flex items-center gap-1">
                    <Layers className="w-3 h-3" />
                    {item.turmas?.nome}
                  </div>
                )}

                <div className="flex justify-between items-start mb-4 mt-2">
                  <div className={`w-12 h-12 rounded-xl ${config.bg} flex items-center justify-center shrink-0`}>
                    <Icon className={`w-6 h-6 ${config.color}`} />
                  </div>
                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="text-gray-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <h3 className="font-bold text-gray-900 mb-1 line-clamp-1" title={item.titulo}>{item.titulo}</h3>
                <p className="text-xs text-gray-500 mb-4 line-clamp-2 flex-1 min-h-[32px]">
                  {item.descricao || 'Sem descrição.'}
                </p>

                <div className="pt-4 border-t border-gray-100">
                  {item.tipo === 'snippet' ? (
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(item.url_conteudo);
                        toast.success("Código copiado para a área de transferência!");
                      }}
                      className="w-full flex justify-center items-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-700 py-2 rounded-xl text-sm font-semibold transition-colors border border-gray-200"
                    >
                      <Code className="w-4 h-4" />
                      Copiar Código
                    </button>
                  ) : (
                    <a 
                      href={item.url_conteudo} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-full flex justify-center items-center gap-2 bg-[#f8f6ff] hover:bg-[#eeeaff] text-[#6c47e6] py-2 rounded-xl text-sm font-semibold transition-colors border border-transparent"
                    >
                      Acessar {config.label.split(' ')[0]}
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-6 relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b pb-4">
              <h2 className="text-xl font-bold text-gray-900">Novo Material</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleSaveMaterial} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Título do Material *</label>
                  <input type="text" required value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: Componentes no React" className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-[#845ef7] outline-none text-sm bg-white"/>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Módulo / Curso *</label>
                  <select required value={cursoSelecionado} onChange={(e) => setCursoSelecionado(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-[#845ef7] outline-none text-sm bg-white cursor-pointer">
                    <option value="" disabled>Selecione o módulo...</option>
                    <optgroup label="Tecnologia">
                      {CATALOGO_CURSOS["Tecnologia"].map(c => <option key={c} value={c}>{c}</option>)}
                    </optgroup>
                    <optgroup label="Inglês e Geral">
                      {CATALOGO_CURSOS["Inglês e Geral"].map(c => <option key={c} value={c}>{c}</option>)}
                    </optgroup>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Tipo *</label>
                  <select value={tipo} onChange={(e) => setTipo(e.target.value as any)} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-[#845ef7] outline-none text-sm bg-white cursor-pointer">
                    <option value="link">Link Web</option>
                    <option value="pdf">Documento PDF</option>
                    <option value="snippet">Trecho de Código</option>
                    <option value="video">Vídeo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Restringir à Turma? (Opcional)</label>
                  <select value={turmaId} onChange={(e) => setTurmaId(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-[#845ef7] outline-none text-sm bg-white cursor-pointer">
                    <option value="">Geral (Todas as turmas verão)</option>
                    {turmas.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  {tipo === 'snippet' ? 'Cole o Código Aqui *' : 'URL / Link do Material *'}
                </label>
                {tipo === 'snippet' ? (
                  <textarea required rows={4} value={urlConteudo} onChange={(e) => setUrlConteudo(e.target.value)} placeholder="<div>Hello World</div>" className="w-full font-mono text-sm border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-[#845ef7] outline-none bg-gray-50"/>
                ) : (
                  <input type="url" required value={urlConteudo} onChange={(e) => setUrlConteudo(e.target.value)} placeholder="https://..." className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-[#845ef7] outline-none text-sm bg-white"/>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Breve Descrição (Opcional)</label>
                <textarea rows={2} value={descricao} onChange={(e) => setDescricao(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-[#845ef7] outline-none text-sm bg-white"/>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">Cancelar</button>
                <button type="submit" disabled={saving} className="px-5 py-2 text-sm font-medium bg-[#6c47e6] hover:bg-[#5533c7] text-white rounded-xl shadow-sm transition-all flex items-center gap-2 disabled:opacity-60">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />} Salvar Material
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}