import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ChevronRight, Layers, BookOpen } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { findCourse } from "@/lib/mock-data";

export const Route = createFileRoute("/biblioteca/$courseId")({
  loader: ({ params }) => {
    const course = findCourse(params.courseId);
    if (!course) throw notFound();
    return { course };
  },
  component: CoursePage,
});

function CoursePage() {
  const { course } = Route.useLoaderData();
  return (
    <AppShell
      breadcrumb={
        <nav className="flex min-w-0 items-center gap-2 text-sm">
          <Link to="/biblioteca" className="text-muted-foreground hover:text-foreground">
            Biblioteca
          </Link>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <span className="truncate font-semibold">{course.title}</span>
        </nav>
      }
    >
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{course.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{course.description}</p>
        </div>
        <Badge variant="secondary" className="rounded-full">
          {course.modules.length} módulos
        </Badge>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {course.modules.map((m) => (
          <Card key={m.id} className="rounded-2xl border-border/60 p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                  <Layers className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="truncate text-base font-semibold">{m.title}</h3>
                  <p className="text-xs text-muted-foreground">
                    {m.lessons.length} aulas · última é prova
                  </p>
                </div>
              </div>
            </div>
            <ul className="mt-4 divide-y divide-border/60 rounded-xl border border-border/60">
              {m.lessons.map((l) => (
                <li key={l.id}>
                  <Link
                    to="/biblioteca/$courseId/$moduleId/$lessonId"
                    params={{ courseId: course.id, moduleId: m.id, lessonId: l.id }}
                    className="flex items-center justify-between gap-3 px-4 py-3 text-sm transition hover:bg-muted/50"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <BookOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="truncate">{l.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {l.isExam && (
                        <Badge className="rounded-full bg-accent-soft text-accent-foreground/80 hover:bg-accent-soft">
                          Prova
                        </Badge>
                      )}
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}