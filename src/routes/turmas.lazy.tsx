import { createLazyFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import React from "react";
import { supabase } from "../lib/supabase";
import { Plus, X, Layers, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createLazyFileRoute("/turmas" as any)({
  component: TurmasPage,
});

interface Turma {
  id: string;
  nome: string;
  ano_letivo: number;
}

function TurmasPage() {
  // ==========================
  // Estados
  // ==========================
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTurma, setEditingTurma] = useState<Turma | null>(null);

  // Estados do Formulário
  const [nome, setNome] = useState("");
  const [anoLetivo, setAnoLetivo] = useState(new Date().getFullYear());

  // ==========================
  // Buscar Turmas
  // ==========================
  const fetchTurmas = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("turmas")
      .select("*")
      .order("nome", { ascending: true });

    if (error) {
      toast.error(error.message);
    } else {
      setTurmas(data ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTurmas();
  }, []);

  // ==========================
  // Controles do Modal
  // ==========================
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

  // ==========================
  // Salvar (Novo ou Editar)
  // ==========================
  const handleSaveTurma = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nome.trim()) {
      toast.error("Informe o nome da turma.");
      return;
    }

    setSaving(true);

    if (editingTurma) {
      const { error } = await supabase
        .from("turmas")
        .update({
          nome,
          ano_letivo: Number(anoLetivo),
        })
        .eq("id", editingTurma.id);

      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Turma atualizada!");
      }
    } else {
      const { error } = await supabase.from("turmas").insert([
        {
          nome,
          ano_letivo: Number(anoLetivo),
        },
      ]);

      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Turma cadastrada!");
      }
    }

    setSaving(false);
    closeModal();
    fetchTurmas();
  };

  // ==========================
  // Excluir (Com Trava de Segurança)
  // ==========================
  const handleDeleteTurma = async (id: string) => {
    const ok = window.confirm("Deseja realmente excluir esta turma?");
    if (!ok) return;

    try {
      // Verifica alunos vinculados
      const { count, error: countError } = await supabase
        .from("alunos")
        .select("*", { count: "exact", head: true })
        .eq("turma_id", id);

      if (countError) throw countError;

      if (count && count > 0) {
        toast.error("Não é possível excluir uma turma que possui alunos cadastrados.");
        return;
      }

      // Deleta a turma se estiver vazia
      const { error } = await supabase.from("turmas").delete().eq("id", id);
      if (error) throw error;

      toast.success("Turma removida com sucesso.");
      fetchTurmas();
    } catch (error: any) {
      toast.error(error.message || "Erro ao excluir turma.");
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Controle de Turmas
          </h1>
          <p className="text-gray-500 mt-1">
            Gerencie as turmas e anos letivos da Escola Discover.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-sm transition-all"
        >
          <Plus className="w-5 h-5" />
          Nova Turma
        </button>
      </div>

      {/* Listagem e Loading */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      ) : turmas.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-12 text-center space-y-4 shadow-sm">
          <Layers className="w-12 h-12 text-gray-300 mx-auto" />
          <h2 className="font-semibold text-lg text-gray-700">
            Nenhuma turma cadastrada
          </h2>
          <p className="text-gray-500 text-sm">
            Clique em "Nova Turma" para começar.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {turmas.map((turma) => (
            <div
              key={turma.id}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <Layers className="text-emerald-600 w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-bold text-lg text-gray-900">
                      {turma.nome}
                    </h2>
                    <p className="text-sm text-gray-500 font-medium">
                      Ano Letivo {turma.ano_letivo}
                    </p>
                  </div>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex gap-2 mt-5 pt-4 border-t border-gray-100">
                <button
                  onClick={() => openEditModal(turma)}
                  className="flex-1 flex justify-center items-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl py-2 transition-colors text-sm font-medium border border-gray-200"
                >
                  <Pencil className="w-4 h-4" />
                  Editar
                </button>

                <button
                  onClick={() => handleDeleteTurma(turma.id)}
                  className="flex-1 flex justify-center items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl py-2 transition-colors text-sm font-medium border border-red-100"
                >
                  <Trash2 className="w-4 h-4" />
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Nova/Editar Turma */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-6 relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b pb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {editingTurma ? "Editar Turma" : "Nova Turma"}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTurma} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome da Turma
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Turma A"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ano Letivo
                </label>
                <input
                  type="number"
                  required
                  min="2020"
                  max="2099"
                  value={anoLetivo}
                  onChange={(e) => setAnoLetivo(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm bg-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm transition-all flex items-center gap-2 disabled:opacity-60"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {saving ? "Salvando..." : editingTurma ? "Atualizar" : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}