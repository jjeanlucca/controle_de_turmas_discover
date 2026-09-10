import { createLazyFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import React from "react";
import { supabase } from "../lib/supabase";
import { 
  Plus, X, ListChecks, CheckCircle, Clock, AlertCircle, 
  Search, Layers, Loader2, Save, BookOpen, Monitor, Star, ChevronDown
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
  const getTypeConfig = (tipo: string) => {
    switch (tipo) {
      case 'Física': return { icon: BookOpen, color: 'text-emerald-600', bg: 'bg-emerald-50' };
      case 'Digital': return { icon: Monitor, color: 'text-blue-600', bg: 'bg-blue-50' };
      case 'Extraclasse': return { icon: Star, color: 'text-amber-600', bg: 'bg-amber-50' };
      default: return { icon: ListChecks, color: 'text-gray-500', bg: 'bg-gray-50' };
    }
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'Entregue': return 'bg-[#f3efff] text-[#6c47e6]';
      case 'Atrasado': return 'bg-red-50 text-red-600';
      default: return 'bg-amber-50 text-amber-600';
    }
  };

  const atividadesFiltradas = atividades.filter(a => {
    const matchBusca = a.titulo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchTurma = selectedTurmaFilter ? a.turma_id === selectedTurmaFilter : true;
    return matchBusca && matchTurma;
  });

  return (
    <div className="min-h-screen bg-gray-50/60">
      <div className="p-4 sm:p-6 md:p-10 max-w-7xl mx-auto space-y-6 md:space-y-8">

        {/* Cabeçalho */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 md:pb-7 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#6c47e6] flex items-center justify-center shadow-sm shadow-[#6c47e6]/20 shrink-0">
              <ListChecks className="w-6 h-6 text-white" strokeWidth={2} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Controle de Tarefas</h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Gerencie prazos, tipos de atividades e lance notas nas planilhas</p>
            </div>
          </div>
          <button
            onClick={openTaskModal}
            className="w-full md:w-auto inline-flex items-center justify-center gap-2 bg-[#6c47e6] hover:bg-[#5533c7] active:bg-[#4a2bb0] text-white px-5 py-2.5 rounded-xl font-medium text-sm shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            Nova tarefa
          </button>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar tarefa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-11 bg-white border border-gray-200 rounded-xl pl-10 pr-4 outline-none focus:border-[#6c47e6] focus:ring-4 focus:ring-[#6c47e6]/10 transition-all text-sm placeholder:text-gray-400"
            />
          </div>
          <div className="relative w-full sm:w-64">
            <Layers className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={selectedTurmaFilter}
              onChange={(e) => setSelectedTurmaFilter(e.target.value)}
              className="w-full h-11 appearance-none bg-white border border-gray-200 rounded-xl pl-10 pr-9 outline-none focus:border-[#6c47e6] focus:ring-4 focus:ring-[#6c47e6]/10 transition-all text-sm cursor-pointer truncate"
            >
              <option value="">Todas as turmas</option>
              {turmas.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Lista de tarefas */}
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 md:py-24 text-gray-400">
            <Loader2 className="w-7 h-7 animate-spin text-[#6c47e6]" />
            <p className="text-sm">Carregando tarefas...</p>
          </div>
        ) : atividadesFiltradas.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-300 rounded-2xl py-12 md:py-20 px-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center mx-auto mb-4">
              <ListChecks className="w-6 h-6 text-gray-300" />
            </div>
            <h3 className="text-base font-semibold text-gray-800">Nenhuma tarefa encontrada</h3>
            <p className="text-gray-500 text-sm mt-1">Cadastre uma nova tarefa para começar o acompanhamento.</p>
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {atividadesFiltradas.map((ativ) => {
              const typeConfig = getTypeConfig(ativ.tipo);
              const TypeIcon = typeConfig.icon;

              return (
                <div
                  key={ativ.id}
                  className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 flex flex-col justify-between hover:border-gray-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                >
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <span className={`inline-flex items-center gap-1.5 ${typeConfig.bg} ${typeConfig.color} px-2.5 py-1 rounded-md text-xs font-medium`}>
                        <TypeIcon className="w-3.5 h-3.5" />
                        {ativ.tipo}
                      </span>
                      {ativ.prazo && (
                        <span className="inline-flex items-center gap-1 text-xs text-gray-500 shrink-0">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(ativ.prazo + 'T12:00:00').toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </div>

                    <h3 className="font-semibold text-gray-900 mt-3 line-clamp-2" title={ativ.titulo}>
                      {ativ.titulo}
                    </h3>
                    <p className="text-sm text-[#6c47e6] font-medium flex items-center gap-1.5 mt-2">
                      <Layers className="w-3.5 h-3.5" />
                      {ativ.turmas?.nome || 'Turma não atribuída'}
                    </p>
                  </div>

                  <button
                    onClick={() => openPlanilha(ativ)}
                    className="w-full mt-5 bg-[#f3efff] hover:bg-[#e3d9ff] text-[#6c47e6] py-2.5 rounded-xl font-medium text-sm transition-colors flex justify-center items-center gap-2"
                  >
                    Abrir planilha de notas
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal: criação de tarefa */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
              <h2 className="text-lg font-bold text-gray-900">Nova tarefa</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTask} className="p-4 sm:p-6 space-y-4 sm:space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Título da atividade</label>
                <input
                  type="text"
                  required
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ex: Workbook Pag. 12"
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-[#6c47e6] focus:ring-4 focus:ring-[#6c47e6]/10 transition-all text-sm bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo de tarefa</label>
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value as any)}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-[#6c47e6] focus:ring-4 focus:ring-[#6c47e6]/10 transition-all text-sm bg-white cursor-pointer"
                >
                  <option value="Física">Física (workbook, caderno, impresso)</option>
                  <option value="Digital">Digital (Wordwall, plataforma, quiz)</option>
                  <option value="Extraclasse">Extraclasse (pesquisa, maquete, projeto)</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Turma</label>
                  <select
                    required
                    value={turmaId}
                    onChange={(e) => setTurmaId(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-[#6c47e6] focus:ring-4 focus:ring-[#6c47e6]/10 transition-all text-sm bg-white cursor-pointer"
                  >
                    <option value="" disabled>Selecione...</option>
                    {turmas.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Prazo final</label>
                  <input
                    type="date"
                    value={prazo}
                    onChange={(e) => setPrazo(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-[#6c47e6] focus:ring-4 focus:ring-[#6c47e6]/10 transition-all text-sm bg-white"
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 sm:pt-2 border-t sm:border-t-0 border-gray-100 mt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors text-center"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingTask}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium bg-[#6c47e6] hover:bg-[#5533c7] text-white rounded-xl shadow-sm transition-colors disabled:opacity-60"
                >
                  {savingTask && <Loader2 className="w-4 h-4 animate-spin" />}
                  Criar tarefa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: planilha inteligente */}
      {isPlanilhaOpen && atividadeSelecionada && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl flex flex-col max-h-[90vh]">

            <div className="flex justify-between items-start px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-100 shrink-0">
              <div>
                <span className="inline-flex bg-gray-100 text-gray-600 text-[11px] font-medium px-2 py-0.5 rounded-md mb-1.5">
                  {atividadeSelecionada.tipo}
                </span>
                <h2 className="text-lg font-bold text-gray-900 leading-tight">{atividadeSelecionada.titulo}</h2>
                <p className="text-sm text-[#6c47e6] font-medium mt-0.5">Turma: {atividadeSelecionada.turmas?.nome}</p>
              </div>
              <button
                onClick={() => setIsPlanilhaOpen(false)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg transition-colors shrink-0 ml-4"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto min-h-[300px] px-4 sm:px-6">
              {loadingPlanilha ? (
                <div className="flex justify-center items-center h-full py-16">
                  <Loader2 className="w-7 h-7 animate-spin text-[#6c47e6]" />
                </div>
              ) : alunosDaTurma.length === 0 ? (
                <div className="text-center text-gray-500 text-sm py-16">Nenhum aluno matriculado nesta turma.</div>
              ) : (
                <div className="w-full overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[500px]">
                    <thead>
                      <tr className="bg-white border-b border-gray-200 text-gray-500 text-xs font-medium sticky top-0 z-10">
                        <th className="py-3 px-2">Aluno</th>
                        <th className="py-3 px-2 w-40">Status</th>
                        <th className="py-3 px-2 w-28 text-right">Nota / visto</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                      {alunosDaTurma.map(aluno => (
                        <tr key={aluno.id} className="hover:bg-gray-50/60 transition-colors">
                          <td className="py-3 px-2 font-medium text-gray-900">{aluno.nome}</td>
                          <td className="py-3 px-2">
                            <select
                              value={notas[aluno.id]?.status || 'Pendente'}
                              onChange={(e) => handleUpdateNota(aluno.id, 'status', e.target.value)}
                              className={`w-full border-0 rounded-lg px-3 py-1.5 outline-none font-medium text-xs cursor-pointer appearance-none focus:ring-4 focus:ring-[#6c47e6]/10 ${getStatusStyles(notas[aluno.id]?.status || 'Pendente')}`}
                            >
                              <option value="Pendente">⌛ Pendente</option>
                              <option value="Entregue">✅ Entregue</option>
                              <option value="Atrasado">⚠️ Atrasado</option>
                            </select>
                          </td>
                          <td className="py-3 px-2 text-right">
                            <input
                              type="number"
                              min="0"
                              max="10"
                              step="0.1"
                              placeholder="-"
                              value={notas[aluno.id]?.nota ?? ''}
                              onChange={(e) => handleUpdateNota(aluno.id, 'nota', e.target.value)}
                              className="w-20 border border-gray-200 rounded-lg px-2 py-1.5 text-center text-sm font-semibold text-gray-900 outline-none focus:border-[#6c47e6] focus:ring-4 focus:ring-[#6c47e6]/10 transition-all"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="px-4 sm:px-6 py-4 border-t border-gray-100 flex flex-col-reverse sm:flex-row justify-end gap-3 shrink-0">
              <button
                onClick={() => setIsPlanilhaOpen(false)}
                className="w-full sm:w-auto px-5 py-2.5 text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl transition-colors text-center"
              >
                Cancelar
              </button>
              <button
                onClick={handleSavePlanilha}
                disabled={savingPlanilha || loadingPlanilha}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-medium bg-[#6c47e6] hover:bg-[#5533c7] text-white rounded-xl shadow-sm transition-colors disabled:opacity-60"
              >
                {savingPlanilha ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Salvar planilha
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}