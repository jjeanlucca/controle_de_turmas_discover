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
    const ok = window.confirm("Deseja realmente excluir esta turma?");
    if (!ok) return;

    try {
      const { count, error: countError } = await supabase
        .from("turma_alunos")
        .select("*", { count: "exact", head: true })
        .eq("turma_id", id);

      if (countError) throw countError;

      if (count && count > 0) {
        toast.error("Não é possível excluir uma turma que possui alunos matriculados.");
        return;
      }

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
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      
      {/* CABEÇALHO */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Controle de Turmas
          </h1>
          <p className="text-gray-500 mt-1">
            Gerencie as turmas e os alunos matriculados na Escola Discover.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-[#6c47e6] hover:bg-[#5533c7] text-white px-5 py-2.5 rounded-xl font-medium shadow-sm transition-all"
        >
          <Plus className="w-5 h-5" />
          Nova Turma
        </button>
      </div>

      {/* LISTAGEM DE TURMAS */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#6c47e6]" />
        </div>
      ) : turmas.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-12 text-center space-y-4 shadow-sm">
          <Layers className="w-12 h-12 text-gray-300 mx-auto" />
          <h2 className="font-semibold text-lg text-gray-700">Nenhuma turma cadastrada</h2>
          <p className="text-gray-500 text-sm">Clique em "Nova Turma" para começar.</p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {turmas.map((turma) => (
            <div key={turma.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-xl bg-[#eeeaff] flex items-center justify-center">
                    <Layers className="text-[#6c47e6] w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-bold text-lg text-gray-900">{turma.nome}</h2>
                    <p className="text-sm text-gray-500 font-medium">Ano Letivo {turma.ano_letivo}</p>
                  </div>
                </div>
              </div>

              {/* Botões do Card - Agora são 3 */}
              <div className="flex gap-2 mt-5 pt-4 border-t border-gray-100">
                <button
                  onClick={() => openAlunosModal(turma)}
                  className="flex-1 flex justify-center items-center gap-2 bg-[#eeeaff] hover:bg-[#d5ccff] text-[#6c47e6] rounded-xl py-2 transition-colors text-xs font-bold uppercase tracking-wide"
                  title="Gerenciar Alunos"
                >
                  <Users className="w-4 h-4" />
                  Alunos
                </button>

                <button
                  onClick={() => openEditModal(turma)}
                  className="flex-1 flex justify-center items-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl py-2 transition-colors text-xs font-bold uppercase tracking-wide border border-gray-200"
                  title="Editar Turma"
                >
                  <Pencil className="w-4 h-4" />
                  Editar
                </button>

                <button
                  onClick={() => handleDeleteTurma(turma.id)}
                  className="flex-1 flex justify-center items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl py-2 transition-colors text-xs font-bold uppercase tracking-wide border border-red-100"
                  title="Excluir Turma"
                >
                  <Trash2 className="w-4 h-4" />
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL 1: CRIAR/EDITAR TURMA */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-6 relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b pb-4">
              <h2 className="text-xl font-bold text-gray-900">{editingTurma ? "Editar Turma" : "Nova Turma"}</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSaveTurma} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Turma</label>
                <input type="text" required value={nome} onChange={(e) => setNome(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-[#845ef7] focus:border-transparent outline-none text-sm bg-white"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ano Letivo</label>
                <input type="number" required min="2020" max="2099" value={anoLetivo} onChange={(e) => setAnoLetivo(Number(e.target.value))} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-[#845ef7] focus:border-transparent outline-none text-sm bg-white"/>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">Cancelar</button>
                <button type="submit" disabled={saving} className="px-5 py-2 text-sm font-medium bg-[#6c47e6] hover:bg-[#5533c7] text-white rounded-xl shadow-sm transition-all flex items-center gap-2 disabled:opacity-60">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {saving ? "Salvando..." : editingTurma ? "Atualizar" : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: GERENCIAR ALUNOS */}
      {isAlunosModalOpen && selectedTurma && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-6 relative animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            
            <div className="flex justify-between items-center border-b pb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Alunos Matriculados</h2>
                <p className="text-sm text-[#6c47e6] font-medium mt-1">{selectedTurma.nome} - Ano {selectedTurma.ano_letivo}</p>
              </div>
              <button onClick={closeAlunosModal} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
            </div>

            {/* Formulário de Adicionar Aluno Rápido */}
            <form onSubmit={handleAddAluno} className="flex gap-2">
              <input 
                type="text" 
                placeholder="Nome completo do novo aluno..." 
                value={novoAlunoNome}
                onChange={(e) => setNovoAlunoNome(e.target.value)}
                className="flex-1 border border-gray-300 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-[#845ef7] outline-none"
              />
              <button 
                type="submit" 
                disabled={addingAluno || !novoAlunoNome.trim()}
                className="bg-[#6c47e6] hover:bg-[#5533c7] text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {addingAluno ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                Matricular
              </button>
            </form>

            {/* Lista de Alunos */}
            <div className="flex-1 overflow-y-auto pr-2 space-y-2 min-h-[200px]">
              {loadingAlunos ? (
                <div className="flex justify-center items-center h-full">
                  <Loader2 className="w-6 h-6 animate-spin text-[#6c47e6]" />
                </div>
              ) : alunosDaTurma.length === 0 ? (
                <div className="text-center text-gray-500 text-sm py-10">
                  Nenhum aluno matriculado nesta turma ainda.
                </div>
              ) : (
                alunosDaTurma.map((aluno) => (
                  <div key={aluno.id} className="flex justify-between items-center bg-gray-50 border border-gray-100 rounded-xl p-3 hover:bg-gray-100 transition-colors">
                    <span className="text-sm font-medium text-gray-700">{aluno.nome}</span>
                    <button 
                      onClick={() => handleRemoveAluno(aluno.id)}
                      className="text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                      title="Remover da turma"
                    >
                      <UserMinus className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="border-t pt-4 flex justify-end">
              <button onClick={closeAlunosModal} className="px-5 py-2 text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl transition-colors">
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}