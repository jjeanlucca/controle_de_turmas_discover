import { createFileRoute, Link } from "@tanstack/react-router";
import { ListChecks, ChevronRight } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TURMAS, findCourse } from "@/lib/mock-data";

export const Route = createFileRoute("/tarefas")({
  component: TarefasIndex,
});

function TarefasIndex() {
  return (
    <AppShell title="Controle de Tarefas">
      <div className="mb-6">
        <h1 className="hidden text-2xl font-bold tracking-tight md:block">
          Controle de Tarefas
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Escolha uma turma para marcar as atividades entregues.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {TURMAS.map((t) => {
          const c = findCourse(t.cursoId);
          return (
            <Link
              key={t.id}
              to="/turmas/$turmaId"
              params={{ turmaId: t.id }}
              className="group"
            >
              <Card className="rounded-2xl border-border/60 p-5 transition group-hover:-translate-y-0.5 group-hover:border-primary/40 group-hover:shadow-md">
                <div className="flex items-start justify-between">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-success-soft text-success">
                    <ListChecks className="h-5 w-5" />
                  </div>
                  <Badge variant="secondary" className="rounded-full">
                    {t.alunos.length} alunos
                  </Badge>
                </div>
                <h3 className="mt-4 text-lg font-semibold">{t.nome}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{c?.title}</p>
                <div className="mt-4 flex items-center gap-1 text-sm font-medium text-primary">
                  Marcar entregas <ChevronRight className="h-4 w-4" />
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </AppShell>
  );
}