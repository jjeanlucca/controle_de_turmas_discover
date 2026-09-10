import { createLazyFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import React from "react";
import { supabase } from "../lib/supabase";
import { Plus, X, Layers, Pencil, Trash2, Loader2, Users, UserPlus, UserMinus } from "lucide-react";
import { toast } from "sonner";

export const Route = createLazyFileRoute("/turmas" as never)({
  component: TurmasPage,
});

interface Turma {
  id: string;
  nome: string;
  ano_letivo: number;
}

interface Aluno {
  id: string;
  nome: string;
}

function TurmasPage() {
  // ==========================
  // Estados Gerais
  // ==========================
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Estados do Modal de Turmas
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTurma, setEditingTurma] = useState<Turma | null>(null);
  const [nome, setNome] = useState("");
  const [anoLetivo, setAnoLetivo] = useState(new Date().getFullYear());

  // ==========================
  // Estados do Modal de Alunos
  // ==========================
  const [isAlunosModalOpen, setIsAlunosModalOpen] = useState(false);
  const [selectedTurma, setSelectedTurma] = useState<Turma | null>(null);
  const [alunosDaTurma, setAlunosDaTurma] = useState<Aluno[]>([]);
  const [loadingAlunos, setLoadingAlunos] = useState(false);
  const [novoAlunoNome, setNovoAlunoNome] = useState("");
  const [addingAluno, setAddingAluno] = useState(false);

  // ==========================
  // Lógica das Turmas
  // ==========================
  const fetchTurmas = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("turmas")
      .select("*")
      .order("nome", { ascending: true });

    if (error) {
      toast.error("Erro ao carregar turmas: " + error.message);
    } else {
      setTurmas(data ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTurmas();
  }, []);

  const openCreateModal = () => {
    setEditingTurma(null);
    setNome("");
    setAnoLetivo(new Date().getFullYear());
    setIsModalOpen(true);
  };

  const openEditModal = (turma: Turma) => {
    setEditingTurma(turma);
    setNome(turma.nome);
    setAnoLetivo(turma.ano_letivo);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTurma(null);
    setNome("");
    setAnoLetivo(new Date().getFullYear());
  };

  const handleSaveTurma = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      toast.error("Informe o nome da turma.");
      return;
    }

    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();

    if (editingTurma) {
      const { error } = await supabase
        .from("turmas")
        .update({ nome, ano_letivo: Number(anoLetivo) })
        .eq("id", editingTurma.id);

      if (error) toast.error(error.message);
      else toast.success("Turma atualizada!");
    } else {
      const { error } = await supabase.from("turmas").insert([
        { nome, ano_letivo: Number(anoLetivo), professor_id: session?.user.id },
      ]);

      if (error) toast.error(error.message);
      else toast.success("Turma cadastrada!");
    }

    setSaving(false);
    closeModal();
    fetchTurmas();
  };

  const handleDeleteTurma = async (id: string) => {
    const ok = window.confirm("Deseja realmente excluir esta turma? Todos os alunos perderão o vínculo e as atividades dela serão apagadas.");
    if (!ok) return;

    try {
      // 1. Primeiro, apagamos os vínculos dos alunos com esta turma
      const { error: errorAlunos } = await supabase.from('turma_alunos').delete().eq('turma_id', id);
      if (errorAlunos) throw errorAlunos;

      // 2. Apagamos as atividades exclusivas desta turma (para não dar erro de chave estrangeira)
      const { error: errorAtividades } = await supabase.from('atividades').delete().eq('turma_id', id);
      if (errorAtividades) throw errorAtividades;

      // 3. Finalmente, excluímos a turma "limpa"
      const { error } = await supabase.from("turmas").delete().eq("id", id);
      if (error) throw error;

      toast.success("Turma removida com sucesso.");
      fetchTurmas();
    } catch (error: any) {
      toast.error("Erro detalhado: " + (error.message || error));
    }
  };

  // ==========================
  // Lógica dos Alunos (Modal 2)
  // ==========================
  const fetchAlunosDaTurma = async (turmaId: string) => {
    setLoadingAlunos(true);
    // Busca na tabela associativa e já puxa os dados da tabela alunos
    const { data, error } = await supabase
      .from("turma_alunos")
      .select("alunos(id, nome)")
      .eq("turma_id", turmaId);

    if (error) {
      toast.error("Erro ao buscar alunos: " + error.message);
    } else if (data) {
      // Achata a resposta do banco para um array simples de Alunos
      const listaFormatada = data
        .map((item: any) => ({
          id: item.alunos.id,
          nome: item.alunos.nome,
        }))
        .sort((a, b) => a.nome.localeCompare(b.nome)); // Ordem alfabética
        
      setAlunosDaTurma(listaFormatada);
    }
    setLoadingAlunos(false);
  };

  const openAlunosModal = (turma: Turma) => {
    setSelectedTurma(turma);
    setIsAlunosModalOpen(true);
    fetchAlunosDaTurma(turma.id);
  };

  const closeAlunosModal = () => {
    setIsAlunosModalOpen(false);
    setSelectedTurma(null);
    setAlunosDaTurma([]);
    setNovoAlunoNome("");
  };

  const handleAddAluno = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoAlunoNome.trim() || !selectedTurma) return;

    setAddingAluno(true);
    try {
      // 1. Cria o aluno na tabela principal
      const { data: alunoData, error: alunoError } = await supabase
        .from("alunos")
        .insert([{ nome: novoAlunoNome, status: 'ativo' }])
        .select("id")
        .single();

      if (alunoError) throw alunoError;

      // 2. Vincula o aluno à turma na tabela associativa N:N
      const { error: linkError } = await supabase
        .from("turma_alunos")
        .insert([{ turma_id: selectedTurma.id, aluno_id: alunoData.id }]);

      if (linkError) throw linkError;

      toast.success("Aluno matriculado com sucesso!");
      setNovoAlunoNome("");
      fetchAlunosDaTurma(selectedTurma.id); // Recarrega a lista
    } catch (error: any) {
      toast.error("Erro ao matricular: " + (error.message || error));
    } finally {
      setAddingAluno(false);
    }
  };

  const handleRemoveAluno = async (alunoId: string) => {
    if (!selectedTurma) return;
    const ok = window.confirm("Desmatricular este aluno da turma?");
    if (!ok) return;

    try {
      // Remove apenas o vínculo da turma (mantém o aluno no banco caso ele faça outros cursos)
      const { error } = await supabase
        .from("turma_alunos")
        .delete()
        .match({ turma_id: selectedTurma.id, aluno_id: alunoId });

      if (error) throw error;
      
      toast.success("Aluno removido da turma.");
      fetchAlunosDaTurma(selectedTurma.id);
    } catch (error: any) {
      toast.error("Erro ao remover: " + (error.message || error));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/60">
      <div className="p-4 sm:p-6 md:p-10 max-w-7xl mx-auto space-y-6 md:space-y-8">

        {/* Cabeçalho */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 md:pb-7 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#6c47e6] flex items-center justify-center shadow-sm shadow-[#6c47e6]/20 shrink-0">
              <Layers className="w-6 h-6 text-white" strokeWidth={2} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Controle de Turmas</h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Gerencie as turmas e os alunos matriculados na Escola Discover</p>
            </div>
          </div>
          <button
            onClick={openCreateModal}
            className="w-full md:w-auto inline-flex items-center justify-center gap-2 bg-[#6c47e6] hover:bg-[#5533c7] active:bg-[#4a2bb0] text-white px-5 py-2.5 rounded-xl font-medium text-sm shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            Nova turma
          </button>
        </div>

        {/* Listagem de turmas */}
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 md:py-24 text-gray-400">
            <Loader2 className="w-7 h-7 animate-spin text-[#6c47e6]" />
            <p className="text-sm">Carregando turmas...</p>
          </div>
        ) : turmas.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-300 rounded-2xl py-12 md:py-20 px-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center mx-auto mb-4">
              <Layers className="w-6 h-6 text-gray-300" />
            </div>
            <h3 className="text-base font-semibold text-gray-800">Nenhuma turma cadastrada</h3>
            <p className="text-gray-500 text-sm mt-1">Clique em "Nova turma" para começar.</p>
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {turmas.map((turma) => (
              <div
                key={turma.id}
                className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 flex flex-col hover:border-gray-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-[#f3efff] flex items-center justify-center shrink-0">
                    <Layers className="text-[#6c47e6] w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-semibold text-gray-900 truncate">{turma.nome}</h2>
                    <p className="text-sm text-gray-500">Ano letivo {turma.ano_letivo}</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 mt-4 sm:mt-5 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => openAlunosModal(turma)}
                    className="w-full sm:flex-1 inline-flex justify-center items-center gap-1.5 bg-[#f3efff] hover:bg-[#e3d9ff] text-[#6c47e6] rounded-xl py-2 transition-colors text-xs font-medium"
                    title="Gerenciar alunos"
                  >
                    <Users className="w-3.5 h-3.5" />
                    Alunos
                  </button>

                  <button
                    onClick={() => openEditModal(turma)}
                    className="w-full sm:flex-1 inline-flex justify-center items-center gap-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl py-2 transition-colors text-xs font-medium border border-gray-200"
                    title="Editar turma"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Editar
                  </button>

                  <button
                    onClick={() => handleDeleteTurma(turma.id)}
                    className="w-full sm:flex-1 inline-flex justify-center items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl py-2 transition-colors text-xs font-medium"
                    title="Excluir turma"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal 1: criar/editar turma */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
              <h2 className="text-lg font-bold text-gray-900">{editingTurma ? "Editar turma" : "Nova turma"}</h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg transition-colors"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <form onSubmit={handleSaveTurma} className="p-4 sm:p-6 space-y-4 sm:space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome da turma</label>
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-[#6c47e6] focus:ring-4 focus:ring-[#6c47e6]/10 transition-all text-sm bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Ano letivo</label>
                <input
                  type="number"
                  required
                  min="2020"
                  max="2099"
                  value={anoLetivo}
                  onChange={(e) => setAnoLetivo(Number(e.target.value))}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-[#6c47e6] focus:ring-4 focus:ring-[#6c47e6]/10 transition-all text-sm bg-white"
                />
              </div>
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
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium bg-[#6c47e6] hover:bg-[#5533c7] text-white rounded-xl shadow-sm transition-colors disabled:opacity-60"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {saving ? "Salvando..." : editingTurma ? "Atualizar" : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: gerenciar alunos */}
      {isAlunosModalOpen && selectedTurma && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col max-h-[85vh]">

            <div className="flex justify-between items-center px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-100 shrink-0">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Alunos matriculados</h2>
                <p className="text-sm text-[#6c47e6] font-medium mt-0.5">{selectedTurma.nome} · Ano {selectedTurma.ano_letivo}</p>
              </div>
              <button
                onClick={closeAlunosModal}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg transition-colors"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto flex-1">
              {/* Adicionar aluno rápido */}
              <form onSubmit={handleAddAluno} className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="Nome completo do novo aluno..."
                  value={novoAlunoNome}
                  onChange={(e) => setNovoAlunoNome(e.target.value)}
                  className="w-full flex-1 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-[#6c47e6] focus:ring-4 focus:ring-[#6c47e6]/10 transition-all"
                />
                <button
                  type="submit"
                  disabled={addingAluno || !novoAlunoNome.trim()}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#6c47e6] hover:bg-[#5533c7] text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed shrink-0"
                >
                  {addingAluno ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                  Matricular
                </button>
              </form>

              {/* Lista de alunos */}
              <div className="space-y-2 min-h-40">
                {loadingAlunos ? (
                  <div className="flex justify-center items-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-[#6c47e6]" />
                  </div>
                ) : alunosDaTurma.length === 0 ? (
                  <div className="text-center text-gray-500 text-sm py-12">
                    Nenhum aluno matriculado nesta turma ainda.
                  </div>
                ) : (
                  alunosDaTurma.map((aluno) => (
                    <div
                      key={aluno.id}
                      className="flex justify-between items-center bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 hover:bg-gray-100 transition-colors"
                    >
                      <span className="text-sm font-medium text-gray-700 truncate mr-2">{aluno.nome}</span>
                      <button
                        onClick={() => handleRemoveAluno(aluno.id)}
                        className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors shrink-0"
                        title="Remover da turma"
                      >
                        <UserMinus className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="px-4 sm:px-6 py-4 border-t border-gray-100 flex justify-end shrink-0">
              <button
                onClick={closeAlunosModal}
                className="w-full sm:w-auto px-5 py-2.5 text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl transition-colors text-center"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}