import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Trophy, AlertCircle } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TURMAS, findCourse } from "@/lib/mock-data";
import { useTarefas, taskKey } from "@/lib/tarefas-store";

export const Route = createFileRoute("/relatorios")({
  component: Relatorios,
});

function Relatorios() {
  const tarefas = useTarefas();
  const turma = TURMAS[0];
  const course = findCourse(turma.cursoId)!;

  const data = useMemo(() => {
    const alunoMedias = turma.alunos.map((a) => {
      let sum = 0;
      let count = 0;
      let done = 0;
      let total = 0;
      for (const m of course.modules) {
        const t = m.lessons.length;
        const d = m.lessons.filter((l) => tarefas[taskKey(turma.id, m.id, a.id, l.id)]).length;
        sum += t === 0 ? 0 : (d / t) * 10;
        count += 1;
        done += d;
        total += t;
      }
      return {
        aluno: a.nome,
        media: count === 0 ? 0 : sum / count,
        entregas: total === 0 ? 0 : Math.round((done / total) * 100),
        pendentes: total - done,
      };
    });

    const modMedias = course.modules.map((m) => {
      let sum = 0;
      let n = 0;
      for (const a of turma.alunos) {
        const t = m.lessons.length;
        const d = m.lessons.filter((l) => tarefas[taskKey(turma.id, m.id, a.id, l.id)]).length;
        sum += t === 0 ? 0 : (d / t) * 10;
        n++;
      }
      return { modulo: m.title, media: n === 0 ? 0 : sum / n };
    });

    const mediaGeral =
      alunoMedias.reduce((s, a) => s + a.media, 0) / (alunoMedias.length || 1);
    const entregasGeral =
      alunoMedias.reduce((s, a) => s + a.entregas, 0) / (alunoMedias.length || 1);
    return { alunoMedias, modMedias, mediaGeral, entregasGeral };
  }, [tarefas, turma, course]);

  const ranking = [...data.alunoMedias].sort((a, b) => b.media - a.media);
  const pendentes = data.alunoMedias.filter((a) => a.pendentes > 0);

  return (
    <AppShell title="Relatórios">
      <div className="mb-6">
        <h1 className="hidden text-2xl font-bold tracking-tight md:block">Relatórios</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {turma.nome} · {course.title}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPI label="Média geral" value={data.mediaGeral.toFixed(1)} />
        <KPI label="Entregas" value={`${Math.round(data.entregasGeral)}%`} />
        <KPI label="Alunos" value={String(turma.alunos.length)} />
        <KPI label="Módulos" value={String(course.modules.length)} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="rounded-2xl border-border/60 p-5">
          <p className="text-sm font-medium text-muted-foreground">Média por módulo</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.modMedias}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="modulo" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid var(--border)",
                    background: "var(--card)",
                  }}
                />
                <Bar dataKey="media" fill="var(--chart-1)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="rounded-2xl border-border/60 p-5">
          <p className="text-sm font-medium text-muted-foreground">Média por aluno</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.alunoMedias} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis type="number" domain={[0, 10]} tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="aluno" tick={{ fontSize: 11 }} width={110} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid var(--border)",
                    background: "var(--card)",
                  }}
                />
                <Bar dataKey="media" fill="var(--chart-2)" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="rounded-2xl border-border/60 p-5">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-accent" />
            <p className="text-sm font-semibold">Ranking da turma</p>
          </div>
          <ol className="mt-4 space-y-2">
            {ranking.map((a, i) => (
              <li
                key={a.aluno}
                className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 px-3 py-2"
              >
                <div className="flex items-center gap-3">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-primary-soft text-xs font-bold text-primary">
                    {i + 1}
                  </span>
                  <span className="text-sm font-medium">{a.aluno}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Progress value={a.media * 10} className="h-1.5 w-24" />
                  <span className="w-10 text-right text-sm font-semibold">
                    {a.media.toFixed(1)}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        </Card>

        <Card className="rounded-2xl border-border/60 p-5">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <p className="text-sm font-semibold">Alunos com tarefas pendentes</p>
          </div>
          {pendentes.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Todos os alunos estão em dia. 🎉
            </p>
          ) : (
            <ul className="mt-4 space-y-2">
              {pendentes.map((a) => (
                <li
                  key={a.aluno}
                  className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 px-3 py-2"
                >
                  <span className="text-sm font-medium">{a.aluno}</span>
                  <Badge className="rounded-full bg-destructive/10 text-destructive hover:bg-destructive/10">
                    {a.pendentes} pendentes
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </AppShell>
  );
}

function KPI({ label, value }: { label: string; value: string }) {
  return (
    <Card className="rounded-2xl border-border/60 p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
    </Card>
  );
}