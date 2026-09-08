import { createLazyFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import React from "react";
import { supabase } from "../lib/supabase";
import { 
  Plus, X, ListChecks, CheckCircle, Clock, AlertCircle, 
  Search, Layers, Loader2, Save, BookOpen, Monitor, Star 
} from "lucide-react";
import { toast } from "sonner";

export const Route = createLazyFileRoute("/tarefas" as never)({
  component: TarefasPage,
});

interface Turma {
  id: string;
  nome: string;
}

interface Atividade {
  id: string;
  titulo: string;
  prazo: string | null;
  turma_id: string | null;
  tipo: 'Física' | 'Digital' | 'Extraclasse';
  turmas?: { nome: string };
}

interface Aluno {
  id: string;
  nome: string;
}

interface Entrega {
  id: string;
  atividade_id: string;
  aluno_id: string;
  status: string;
  nota: number | null;
}

function TarefasPage() {
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTurmaFilter, setSelectedTurmaFilter] = useState("");

  // Modal de Criação
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [savingTask, setSavingTask] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [prazo, setPrazo] = useState("");
  const [turmaId, setTurmaId] = useState("");
  const [tipo, setTipo] = useState<'Física' | 'Digital' | 'Extraclasse'>('Física');

  // Modal da Planilha Inteligente
  const [isPlanilhaOpen, setIsPlanilhaOpen] = useState(false);
  const [atividadeSelecionada, setAtividadeSelecionada] = useState<Atividade | null>(null);
  const [alunosDaTurma, setAlunosDaTurma] = useState<Aluno[]>([]);
  const [entregasOriginais, setEntregasOriginais] = useState<Entrega[]>([]);
  const [notas, setNotas] = useState<Record<string, { status: string; nota: string | number }>>({});
  const [savingPlanilha, setSavingPlanilha] = useState(false);
  const [loadingPlanilha, setLoadingPlanilha] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const { data: turmasData } = await supabase.from('turmas').select('id, nome').order('nome');
    setTurmas(turmasData || []);

    const { data: ativData, error } = await supabase
      .from('atividades')
      .select('*, turmas(nome)')
      .order('prazo', { ascending: false });

    if (error) toast.error("Erro ao carregar tarefas: " + error.message);
    else setAtividades(ativData || []);
    
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ==========================
  // LÓGICA DE CRIAÇÃO
  // ==========================
  const openTaskModal = () => {
    setTitulo("");
    setPrazo("");
    setTurmaId("");
    setTipo("Física");
    setIsModalOpen(true);
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || !turmaId) {
      toast.error("Preencha o título e selecione uma turma.");
      return;
    }

    setSavingTask(true);
    const { error } = await supabase.from('atividades').insert([{
      titulo,
      prazo: prazo || null,
      turma_id: turmaId,
      tipo
    }]);

    if (error) {
      toast.error("Erro ao criar tarefa: " + error.message);
    } else {
      toast.success("Tarefa criada com sucesso!");
      setIsModalOpen(false);
      fetchData();
    }
    setSavingTask(false);
  };

  // ==========================
  // LÓGICA DA PLANILHA (NOTAS E STATUS)
  // ==========================
  const openPlanilha = async (atividade: Atividade) => {
    if (!atividade.turma_id) {
      toast.error("Esta tarefa não está vinculada a uma turma específica.");
      return;
    }
    
    setAtividadeSelecionada(atividade);
    setIsPlanilhaOpen(true);
    setLoadingPlanilha(true);

    // 1. Busca os alunos da turma
    const { data: relacoes } = await supabase
      .from('turma_alunos')
      .select('alunos(id, nome)')
      .eq('turma_id', atividade.turma_id);

    const alunosFormatados = relacoes?.map((r: any) => ({
      id: r.alunos.id,
      nome: r.alunos.nome
    })).sort((a, b) => a.nome.localeCompare(b.nome)) || [];
    
    setAlunosDaTurma(alunosFormatados);

    // 2. Busca as entregas já existentes dessa atividade
    const { data: entregas } = await supabase
      .from('entregas')
      .select('*')
      .eq('atividade_id', atividade.id);

    setEntregasOriginais(entregas || []);

    // 3. Monta o estado local para edição
    const notasIniciais: Record<string, { status: string; nota: string | number }> = {};
    alunosFormatados.forEach(aluno => {
      const entregaExistente = entregas?.find(e => e.aluno_id === aluno.id);
      notasIniciais[aluno.id] = {
        status: entregaExistente?.status || 'Pendente',
        nota: entregaExistente?.nota !== null && entregaExistente?.nota !== undefined ? entregaExistente.nota : ''
      };
    });

    setNotas(notasIniciais);
    setLoadingPlanilha(false);
  };

  const handleUpdateNota = (alunoId: string, campo: 'status' | 'nota', valor: string) => {
    setNotas(prev => ({
      ...prev,
      [alunoId]: {
        ...prev[alunoId],
        [campo]: valor
      }
    }));
  };

  const handleSavePlanilha = async () => {
    if (!atividadeSelecionada) return;
    setSavingPlanilha(true);

    // Monta o payload incluindo o ID da entrega caso ela já exista para realizar o UPSERT corretamente
    const payload = alunosDaTurma.map(aluno => {
      const idEntregaExistente = entregasOriginais.find(e => e.aluno_id === aluno.id)?.id;
      const notaValor = notas[aluno.id].nota;
      
      const item: any = {
        atividade_id: atividadeSelecionada.id,
        aluno_id: aluno.id,
        status: notas[aluno.id].status,
        nota: notaValor === '' ? null : Number(notaValor),
      };

      if (idEntregaExistente) {
        item.id = idEntregaExistente;
      }
      
      return item;
    });

    const { error } = await supabase.from('entregas').upsert(payload);

    if (error) {
      toast.error("Erro ao salvar notas: " + error.message);
    } else {
      toast.success("Planilha atualizada com sucesso!");
      setIsPlanilhaOpen(false);
    }
    setSavingPlanilha(false);
  };

  // ==========================
  // RENDERIZAÇÃO E FILTROS
  // ==========================
  const getTypeIcon = (tipo: string) => {
    switch(tipo) {
      case 'Física': return <BookOpen className="w-4 h-4 text-emerald-600" />;
      case 'Digital': return <Monitor className="w-4 h-4 text-blue-600" />;
      case 'Extraclasse': return <Star className="w-4 h-4 text-amber-500" />;
      default: return <ListChecks className="w-4 h-4 text-gray-500" />;
    }
  };

  const atividadesFiltradas = atividades.filter(a => {
    const matchBusca = a.titulo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchTurma = selectedTurmaFilter ? a.turma_id === selectedTurmaFilter : true;
    return matchBusca && matchTurma;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      
      {/* CABEÇALHO */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Controle de Tarefas</h1>
          <p className="text-gray-500 mt-1">Gerencie prazos, tipos de atividades e lance notas nas planilhas.</p>
        </div>
        <button
          onClick={openTaskModal}
          className="flex items-center gap-2 bg-[#6c47e6] hover:bg-[#5533c7] text-white px-5 py-2.5 rounded-xl font-medium shadow-sm transition-all"
        >
          <Plus className="w-5 h-5" />
          Nova Tarefa
        </button>
      </div>

      {/* FILTROS */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
        <div className="relative w-full sm:flex-1">
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar tarefa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 outline-none focus:bg-white focus:ring-2 focus:ring-[#845ef7] transition-all text-sm"
          />
        </div>
        <div className="relative w-full sm:w-64">
          <Layers className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <select
            value={selectedTurmaFilter}
            onChange={(e) => setSelectedTurmaFilter(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 outline-none focus:bg-white focus:ring-2 focus:ring-[#845ef7] transition-all text-sm cursor-pointer appearance-none truncate"
          >
            <option value="">Todas as Turmas</option>
            {turmas.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
          </select>
        </div>
      </div>

      {/* LISTA DE TAREFAS */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#6c47e6]" />
        </div>
      ) : atividadesFiltradas.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-16 text-center space-y-4">
          <ListChecks className="w-16 h-16 text-gray-300 mx-auto" />
          <h3 className="text-lg font-bold text-gray-700">Nenhuma tarefa encontrada</h3>
          <p className="text-gray-500 text-sm">Cadastre uma nova tarefa para começar o acompanhamento.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {atividadesFiltradas.map((ativ) => (
            <div key={ativ.id} className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2 bg-gray-50 px-2.5 py-1 rounded-md border border-gray-100">
                    {getTypeIcon(ativ.tipo)}
                    <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">{ativ.tipo}</span>
                  </div>
                  {ativ.prazo && (
                    <span className="text-xs font-medium text-gray-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(ativ.prazo + 'T12:00:00').toLocaleDateString('pt-BR')}
                    </span>
                  )}
                </div>
                
                <h3 className="font-bold text-gray-900 text-lg mb-1 mt-3 line-clamp-2" title={ativ.titulo}>
                  {ativ.titulo}
                </h3>
                <p className="text-sm text-[#6c47e6] font-medium flex items-center gap-1.5 mt-2">
                  <Layers className="w-4 h-4" />
                  {ativ.turmas?.nome || 'Turma não atribuída'}
                </p>
              </div>

              <button
                onClick={() => openPlanilha(ativ)}
                className="w-full mt-6 bg-[#eeeaff] hover:bg-[#d5ccff] text-[#6c47e6] py-2.5 rounded-xl font-bold text-sm transition-colors flex justify-center items-center gap-2"
              >
                Abrir Planilha de Notas
              </button>
            </div>
          ))}
        </div>
      )}

      {/* MODAL CRIAÇÃO DE TAREFA */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-6 relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b pb-4">
              <h2 className="text-xl font-bold text-gray-900">Nova Tarefa</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleSaveTask} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Título da Atividade *</label>
                <input type="text" required value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: Workbook Pag. 12" className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-[#845ef7] outline-none text-sm bg-white"/>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Tipo de Tarefa *</label>
                <select value={tipo} onChange={(e) => setTipo(e.target.value as any)} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-[#845ef7] outline-none text-sm bg-white cursor-pointer">
                  <option value="Física">Física (Workbook, Caderno, Impresso)</option>
                  <option value="Digital">Digital (Wordwall, Plataforma, Quiz)</option>
                  <option value="Extraclasse">Extraclasse (Pesquisa, Maquete, Projeto)</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Turma *</label>
                  <select required value={turmaId} onChange={(e) => setTurmaId(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-[#845ef7] outline-none text-sm bg-white cursor-pointer">
                    <option value="" disabled>Selecione...</option>
                    {turmas.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Prazo Final</label>
                  <input type="date" value={prazo} onChange={(e) => setPrazo(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-[#845ef7] outline-none text-sm bg-white"/>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">Cancelar</button>
                <button type="submit" disabled={savingTask} className="px-5 py-2 text-sm font-medium bg-[#6c47e6] hover:bg-[#5533c7] text-white rounded-xl shadow-sm transition-all flex items-center gap-2">
                  {savingTask && <Loader2 className="w-4 h-4 animate-spin" />} Criar Tarefa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PLANILHA INTELIGENTE */}
      {isPlanilhaOpen && atividadeSelecionada && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl p-6 space-y-6 relative animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            
            <div className="flex justify-between items-start border-b pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-gray-100 text-gray-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {atividadeSelecionada.tipo}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-gray-900">{atividadeSelecionada.titulo}</h2>
                <p className="text-sm text-[#6c47e6] font-medium mt-1">Turma: {atividadeSelecionada.turmas?.nome}</p>
              </div>
              <button onClick={() => setIsPlanilhaOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
            </div>

            <div className="flex-1 overflow-y-auto min-h-[300px]">
              {loadingPlanilha ? (
                <div className="flex justify-center items-center h-full">
                  <Loader2 className="w-8 h-8 animate-spin text-[#6c47e6]" />
                </div>
              ) : alunosDaTurma.length === 0 ? (
                <div className="text-center text-gray-500 py-10">Nenhum aluno matriculado nesta turma.</div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs uppercase tracking-wider font-semibold sticky top-0 z-10">
                      <th className="py-3 px-4">Aluno</th>
                      <th className="py-3 px-4 w-40">Status</th>
                      <th className="py-3 px-4 w-32 text-right">Nota / Visto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                    {alunosDaTurma.map(aluno => (
                      <tr key={aluno.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-3 px-4 font-medium text-gray-900">{aluno.nome}</td>
                        <td className="py-3 px-4">
                          <select
                            value={notas[aluno.id]?.status || 'Pendente'}
                            onChange={(e) => handleUpdateNota(aluno.id, 'status', e.target.value)}
                            className={`w-full border-0 rounded-lg px-3 py-1.5 outline-none font-bold text-xs cursor-pointer appearance-none
                              ${notas[aluno.id]?.status === 'Entregue' ? 'bg-[#eeeaff] text-[#6c47e6]' : 
                                notas[aluno.id]?.status === 'Atrasado' ? 'bg-red-50 text-red-600' : 
                                'bg-amber-50 text-amber-600'}`}
                          >
                            <option value="Pendente">⌛ Pendente</option>
                            <option value="Entregue">✅ Entregue</option>
                            <option value="Atrasado">⚠️ Atrasado</option>
                          </select>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <input
                            type="number"
                            min="0"
                            max="10"
                            step="0.1"
                            placeholder="-"
                            value={notas[aluno.id]?.nota || ''}
                            onChange={(e) => handleUpdateNota(aluno.id, 'nota', e.target.value)}
                            className="w-20 border border-gray-200 rounded-lg px-2 py-1.5 text-center text-sm font-bold text-gray-900 focus:ring-2 focus:ring-[#845ef7] outline-none"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="border-t pt-4 flex justify-end gap-3">
              <button onClick={() => setIsPlanilhaOpen(false)} className="px-5 py-2.5 text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl transition-colors">
                Cancelar
              </button>
              <button 
                onClick={handleSavePlanilha} 
                disabled={savingPlanilha || loadingPlanilha}
                className="px-6 py-2.5 text-sm font-bold bg-[#6c47e6] hover:bg-[#5533c7] text-white rounded-xl shadow-sm transition-all flex items-center gap-2"
              >
                {savingPlanilha ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} 
                Salvar Planilha
              </button>
            </div>
            
          </div>
        </div>
      )}

    </div>
  );
}