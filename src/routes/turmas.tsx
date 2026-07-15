import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Users, ChevronRight, Plus } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TURMAS, findCourse } from "@/lib/mock-data";

export const Route = createFileRoute("/turmas")({
  component: TurmasLayout,
});

function TurmasLayout() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  if (pathname !== "/turmas") return <Outlet />;
  return (
    <AppShell title="Turmas">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="hidden text-2xl font-bold tracking-tight md:block">Turmas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gerencie suas turmas, alunos e o controle de tarefas.
          </p>
        </div>
        <Button className="rounded-xl">
          <Plus className="mr-1.5 h-4 w-4" /> Nova turma
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {TURMAS.map((t) => {
          const course = findCourse(t.cursoId);
          return (
            <Link key={t.id} to="/turmas/$turmaId" params={{ turmaId: t.id }} className="group">
              <Card className="rounded-2xl border-border/60 p-5 transition group-hover:-translate-y-0.5 group-hover:border-primary/40 group-hover:shadow-md">
                <div className="flex items-start justify-between">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary-soft text-primary">
                    <Users className="h-5 w-5" />
                  </div>
                  <Badge variant="secondary" className="rounded-full">
                    {t.alunos.length} alunos
                  </Badge>
                </div>
                <h3 className="mt-4 text-lg font-semibold">{t.nome}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {course?.title} · {t.ano}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{t.professor}</p>
                <div className="mt-4 flex items-center gap-1 text-sm font-medium text-primary">
                  Abrir turma <ChevronRight className="h-4 w-4" />
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </AppShell>
  );
}