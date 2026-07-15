import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { BookOpen, ChevronRight } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { COURSES } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/biblioteca")({
  component: BibliotecaLayout,
});

function BibliotecaLayout() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  if (pathname !== "/biblioteca") return <Outlet />;
  return (
    <AppShell title="Biblioteca Digital">
      <div className="mb-6">
        <h1 className="hidden text-2xl font-bold tracking-tight md:block">
          Biblioteca Digital
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Todos os cursos, módulos e aulas em um só lugar.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {COURSES.map((c) => {
          const totalLessons = c.modules.reduce((s, m) => s + m.lessons.length, 0);
          return (
            <Link key={c.id} to="/biblioteca/$courseId" params={{ courseId: c.id }} className="group">
              <Card className="h-full overflow-hidden rounded-2xl border-border/60 p-0 transition group-hover:-translate-y-0.5 group-hover:border-primary/40 group-hover:shadow-lg">
                <div className="relative h-28 overflow-hidden bg-gradient-to-br from-primary via-primary to-accent">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,white_0%,transparent_50%)] opacity-15" />
                  <div className="absolute right-4 top-4">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/15 text-white backdrop-blur">
                      <BookOpen className="h-5 w-5" />
                    </div>
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="rounded-full">
                      {c.modules.length} módulos
                    </Badge>
                    <Badge variant="secondary" className="rounded-full">
                      {totalLessons} aulas
                    </Badge>
                  </div>
                  <h3 className="mt-3 text-lg font-semibold">{c.title}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {c.description}
                  </p>
                  <div className="mt-4 flex items-center gap-1 text-sm font-medium text-primary">
                    Abrir curso <ChevronRight className="h-4 w-4" />
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </AppShell>
  );
}