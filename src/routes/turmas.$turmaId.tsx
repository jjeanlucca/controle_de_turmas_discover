import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { findTurma, findCourse, type CourseModule, type Lesson, type Aluno } from "@/lib/mock-data";
import { useTarefas, toggleTask, taskKey } from "@/lib/tarefas-store";

export const Route = createFileRoute("/turmas/$turmaId")({
  loader: ({ params }) => {
    const turma = findTurma(params.turmaId);
    if (!turma) throw notFound();
    const course = findCourse(turma.cursoId);
    if (!course) throw notFound();
    return { turma, course };
  },
  component: TurmaPage,
});

function moduleGrade(
  turmaId: string,
  m: CourseModule,
  aluno: Aluno,
  tarefas: Record<string, boolean>,
) {
  const total = m.lessons.length;
  const done = m.lessons.filter((l) => tarefas[taskKey(turmaId, m.id, aluno.id, l.id)]).length;
  return total === 0 ? 0 : (done / total) * 10;
}

function TurmaPage() {
  const { turma, course } = Route.useLoaderData();
  const tarefas = useTarefas();
  const [activeMod, setActiveMod] = useState(course.modules[0].id);

  const stats = useMemo(() => {
    let total = 0;
    let done = 0;
    let sum = 0;
    let count = 0;
    for (const m of course.modules) {
      for (const a of turma.alunos) {
        for (const l of m.lessons) {
          total++;
          if (tarefas[taskKey(turma.id, m.id, a.id, l.id)]) done++;
        }
        sum += moduleGrade(turma.id, m, a, tarefas);
        count++;
      }
    }
    return {
      entregas: total === 0 ? 0 : Math.round((done / total) * 100),
      media: count === 0 ? 0 : sum / count,
    };
  }, [tarefas, turma, course]);

  return (
    <AppShell
      breadcrumb={
        <nav className="flex min-w-0 items-center gap-2 text-sm">
          <Link to="/turmas" className="text-muted-foreground hover:text-foreground">
            Turmas
          </Link>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <span className="truncate font-semibold">{turma.nome}</span>
        </nav>
      }
    >
      <header className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{turma.nome}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {course.title} · {turma.professor} · {turma.ano}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3 text-sm">
          <Stat label="Alunos" value={String(turma.alunos.length)} />
          <Stat label="Entregas" value={`${stats.entregas}%`} />
          <Stat label="Média" value={stats.media.toFixed(1)} />
        </div>
      </header>

      <Tabs value={activeMod} onValueChange={setActiveMod}>
        <TabsList className="mb-4 flex h-auto w-full flex-wrap justify-start gap-1 rounded-xl bg-muted/60 p-1">
          {course.modules.map((m: CourseModule) => (
            <TabsTrigger key={m.id} value={m.id} className="rounded-lg data-[state=active]:bg-background">
              {m.title}
            </TabsTrigger>
          ))}
        </TabsList>

        {course.modules.map((m: CourseModule) => (
          <TabsContent key={m.id} value={m.id} className="mt-0">
            <ModuleTable turmaId={turma.id} alunos={turma.alunos} module={m} tarefas={tarefas} />
          </TabsContent>
        ))}
      </Tabs>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card px-3 py-2">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-lg font-bold">{value}</p>
    </div>
  );
}

function ModuleTable({
  turmaId,
  alunos,
  module: m,
  tarefas,
}: {
  turmaId: string;
  alunos: Aluno[];
  module: CourseModule;
  tarefas: Record<string, boolean>;
}) {
  return (
    <Card className="overflow-hidden rounded-2xl border-border/60 p-0">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 bg-muted/30 px-5 py-3">
        <div>
          <p className="text-sm font-semibold">{m.title}</p>
          <p className="text-xs text-muted-foreground">
            {m.lessons.length} aulas · a última é a prova · média calculada automaticamente
          </p>
        </div>
        <Badge variant="secondary" className="rounded-full">
          {alunos.length} alunos
        </Badge>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border/60 bg-muted/20 text-left">
              <th className="sticky left-0 z-10 bg-muted/20 px-4 py-3 font-semibold text-muted-foreground">
                Aluno
              </th>
              {m.lessons.map((l: Lesson) => (
                <th key={l.id} className="whitespace-nowrap px-3 py-3 text-center font-medium text-muted-foreground">
                  {l.isExam ? "Prova" : `Aula ${l.id.split("-")[1]}`}
                </th>
              ))}
              <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Média</th>
            </tr>
          </thead>
          <tbody>
            {alunos.map((a) => {
              const media = moduleGrade(turmaId, m, a, tarefas);
              return (
                <tr key={a.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                  <td className="sticky left-0 z-10 bg-background/95 px-4 py-3 font-medium">
                    {a.nome}
                  </td>
                  {m.lessons.map((l) => {
                    const k = taskKey(turmaId, m.id, a.id, l.id);
                    return (
                      <td key={l.id} className="px-3 py-3 text-center">
                        <Checkbox
                          checked={!!tarefas[k]}
                          onCheckedChange={() => toggleTask(k)}
                          aria-label={`${a.nome} · ${l.title}`}
                        />
                      </td>
                    );
                  })}
                  <td className="px-4 py-3 text-right">
                    <span
                      className={
                        "inline-flex min-w-[52px] items-center justify-center rounded-full px-2.5 py-1 text-xs font-semibold " +
                        (media >= 7
                          ? "bg-success-soft text-success"
                          : media >= 5
                          ? "bg-accent-soft text-accent-foreground/80"
                          : "bg-destructive/10 text-destructive")
                      }
                    >
                      {media.toFixed(1)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}