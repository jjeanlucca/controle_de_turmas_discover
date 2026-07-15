import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  ChevronRight,
  BookOpen,
  Gamepad2,
  Zap,
  FileText,
  Video,
  StickyNote,
  ExternalLink,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { findCourse } from "@/lib/mock-data";

export const Route = createFileRoute("/biblioteca/$courseId/$moduleId/$lessonId")({
  loader: ({ params }) => {
    const course = findCourse(params.courseId);
    const module = course?.modules.find((m) => m.id === params.moduleId);
    const lesson = module?.lessons.find((l) => l.id === params.lessonId);
    if (!course || !module || !lesson) throw notFound();
    return { course, module, lesson };
  },
  component: LessonPage,
});

function LessonPage() {
  const { course, module, lesson } = Route.useLoaderData();
  const items = [
    { key: "livroDigital", label: "Livro Digital", icon: BookOpen, url: lesson.resources.livroDigital, tone: "bg-primary-soft text-primary" },
    { key: "wordwall", label: "Wordwall", icon: Gamepad2, url: lesson.resources.wordwall, tone: "bg-accent-soft text-accent" },
    { key: "kahoot", label: "Kahoot", icon: Zap, url: lesson.resources.kahoot, tone: "bg-success-soft text-success" },
    { key: "pdf", label: "PDF complementar", icon: FileText, url: lesson.resources.pdf, tone: "bg-muted text-foreground/70" },
    { key: "video", label: "Vídeo complementar", icon: Video, url: lesson.resources.video, tone: "bg-primary-soft text-primary" },
  ] as const;
  return (
    <AppShell
      breadcrumb={
        <nav className="flex min-w-0 items-center gap-2 text-sm">
          <Link to="/biblioteca" className="text-muted-foreground hover:text-foreground">Biblioteca</Link>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <Link
            to="/biblioteca/$courseId"
            params={{ courseId: course.id }}
            className="truncate text-muted-foreground hover:text-foreground"
          >
            {course.title}
          </Link>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <span className="truncate font-semibold">
            {module.title} · {lesson.title}
          </span>
        </nav>
      }
    >
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            {course.title} · {module.title}
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">{lesson.title}</h1>
        </div>
        {lesson.isExam && (
          <Badge className="rounded-full bg-accent text-accent-foreground">Prova</Badge>
        )}
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((i) => (
          <Card key={i.key} className="flex flex-col rounded-2xl border-border/60 p-5">
            <div className={`grid h-11 w-11 place-items-center rounded-xl ${i.tone}`}>
              <i.icon className="h-5 w-5" />
            </div>
            <p className="mt-4 font-semibold">{i.label}</p>
            <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{i.url}</p>
            <a
              href={i.url}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
            >
              Abrir link <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </Card>
        ))}

        <Card className="rounded-2xl border-border/60 p-5 md:col-span-2 lg:col-span-3">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-muted text-foreground/70">
              <StickyNote className="h-5 w-5" />
            </div>
            <p className="font-semibold">Observações</p>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            {lesson.resources.observacoes}
          </p>
        </Card>
      </div>
    </AppShell>
  );
}