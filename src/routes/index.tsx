import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BookOpen,
  ListChecks,
  BarChart3,
  Settings,
  Users,
  GraduationCap,
  TrendingUp,
  Layers,
  ArrowUpRight,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/")({
  component: Dashboard,
});

const shortcuts = [
  {
    title: "Biblioteca Digital",
    description: "Cursos, módulos e aulas",
    icon: BookOpen,
    to: "/biblioteca" as const,
    tone: "bg-primary-soft text-primary",
  },
  {
    title: "Controle de Tarefas",
    description: "Marque atividades entregues",
    icon: ListChecks,
    to: "/tarefas" as const,
    tone: "bg-success-soft text-success",
  },
  {
    title: "Relatórios",
    description: "Médias e desempenho",
    icon: BarChart3,
    to: "/relatorios" as const,
    tone: "bg-accent-soft text-accent",
  },
  {
    title: "Configurações",
    description: "Turmas, alunos e perfil",
    icon: Settings,
    to: "/configuracoes" as const,
    tone: "bg-muted text-foreground/70",
  },
];

const indicators = [
  { label: "Alunos", value: "28", icon: Users, hint: "3 turmas ativas" },
  { label: "Média Geral", value: "8,4", icon: TrendingUp, hint: "+0,3 vs. mês anterior" },
  { label: "Tarefas Entregues", value: "82%", icon: ListChecks, hint: "42 pendentes" },
  { label: "Módulo Atual", value: "Excel", icon: Layers, hint: "Aula 4 de 10" },
];

function Dashboard() {
  return (
    <AppShell title="Dashboard">
      {/* Hero header */}
      <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-primary/95 via-primary to-primary/70 p-6 text-primary-foreground shadow-[0_20px_60px_-30px_oklch(0.52_0.18_258/0.6)] md:p-8">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-accent/30 blur-3xl" />
        <div className="absolute -bottom-24 -left-10 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <Badge className="mb-3 rounded-full border-white/20 bg-white/10 text-primary-foreground hover:bg-white/20">
              Ano letivo 2026
            </Badge>
            <h1 className="text-2xl font-bold leading-tight md:text-3xl">
              Bom dia, Prof. Marcos 👋
            </h1>
            <p className="mt-2 max-w-xl text-sm text-primary-foreground/80 md:text-base">
              Suas turmas estão indo bem. Continue acompanhando as entregas do módulo
              atual.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
            {[
              { k: "Professor", v: "Marcos A." },
              { k: "Turma", v: "Turma A" },
              { k: "Curso", v: "Informática" },
              { k: "Ano", v: "2026" },
            ].map((i) => (
              <div
                key={i.k}
                className="rounded-2xl border border-white/15 bg-white/10 px-3 py-2 backdrop-blur"
              >
                <p className="text-[11px] uppercase tracking-wide text-primary-foreground/70">
                  {i.k}
                </p>
                <p className="mt-0.5 truncate font-semibold">{i.v}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Indicators */}
      <section className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {indicators.map((i) => (
          <Card
            key={i.label}
            className="rounded-2xl border-border/60 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-primary">
                <i.icon className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {i.label}
            </p>
            <p className="mt-1 text-2xl font-bold tracking-tight">{i.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{i.hint}</p>
          </Card>
        ))}
      </section>

      {/* Shortcuts */}
      <section className="mt-8">
        <div className="mb-3 flex items-end justify-between">
          <h2 className="text-lg font-semibold">Acesso rápido</h2>
          <span className="text-xs text-muted-foreground">
            Toque em um cartão para abrir
          </span>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {shortcuts.map((s) => (
            <Link key={s.to} to={s.to} className="group">
              <Card className="h-full rounded-2xl border-border/60 p-5 transition group-hover:-translate-y-0.5 group-hover:border-primary/40 group-hover:shadow-md">
                <div className="flex items-start justify-between">
                  <div className={`grid h-11 w-11 place-items-center rounded-xl ${s.tone}`}>
                    <s.icon className="h-5 w-5" />
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground transition group-hover:text-primary" />
                </div>
                <p className="mt-4 text-base font-semibold">{s.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{s.description}</p>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Progresso do módulo atual */}
      <section className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="rounded-2xl border-border/60 p-6 lg:col-span-2">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-primary" />
            <p className="text-sm font-medium text-muted-foreground">Módulo atual</p>
          </div>
          <h3 className="mt-1 text-xl font-semibold">Excel · Turma A</h3>
          <div className="mt-5 space-y-4">
            {[
              { l: "Aula 1 — Introdução", v: 100 },
              { l: "Aula 2 — Fórmulas básicas", v: 92 },
              { l: "Aula 3 — Gráficos", v: 74 },
              { l: "Aula 4 — Funções", v: 40 },
            ].map((r) => (
              <div key={r.l}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="font-medium">{r.l}</span>
                  <span className="text-muted-foreground">{r.v}% entregas</span>
                </div>
                <Progress value={r.v} className="h-2" />
              </div>
            ))}
          </div>
        </Card>

        <Card className="rounded-2xl border-border/60 p-6">
          <p className="text-sm font-medium text-muted-foreground">Turmas ativas</p>
          <ul className="mt-4 space-y-3">
            {[
              { n: "Turma A", c: "Informática", a: 10 },
              { n: "Turma B", c: "Robótica Ano 1", a: 8 },
              { n: "Turma C", c: "Criação de Games 1", a: 10 },
            ].map((t) => (
              <li
                key={t.n}
                className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/30 p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{t.n}</p>
                  <p className="truncate text-xs text-muted-foreground">{t.c}</p>
                </div>
                <Badge variant="secondary" className="rounded-full">
                  {t.a} alunos
                </Badge>
              </li>
            ))}
          </ul>
          <Link
            to="/turmas"
            className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Ver todas as turmas
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </Card>
      </section>
    </AppShell>
  );
}