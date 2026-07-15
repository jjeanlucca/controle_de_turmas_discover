import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

// Definindo a rota
export const Route = createFileRoute("/turmas")({
  component: TurmasPage,
});

function TurmasPage() {
  const [turmas, setTurmas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTurmas() {
      // Usamos a conexão centralizada que configuramos no __root.tsx
      const { data, error } = await supabase
        .from("turmas")
        .select(`
          id,
          nome,
          ano_letivo,
          cursos(titulo)
        `);

      if (error) {
        console.error("Erro ao buscar turmas:", error);
      } else {
        setTurmas(data || []);
      }
      setLoading(false);
    }

    fetchTurmas();
  }, []);

  if (loading) return <div>Carregando turmas...</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Minhas Turmas</h1>
      
      {turmas.length === 0 ? (
        <p>Nenhuma turma encontrada.</p>
      ) : (
        <div className="grid gap-4">
          {turmas.map((turma) => (
            <div key={turma.id} className="p-4 border rounded-lg shadow-sm bg-white">
              <h2 className="font-semibold text-lg">{turma.nome}</h2>
              <p className="text-sm text-gray-600">Ano Letivo: {turma.ano_letivo}</p>
              <p className="text-sm text-emerald-600">Curso: {turma.cursos?.titulo}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}