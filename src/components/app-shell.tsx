import type { ReactNode } from "react";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Input } from "@/components/ui/input";
import { Search, Bell } from "lucide-react";

export function AppShell({
  title,
  breadcrumb,
  actions,
  children,
}: {
  title?: string;
  breadcrumb?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-background">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border/60 bg-background/80 px-4 backdrop-blur md:px-6">
          <SidebarTrigger className="-ml-1" />
          <div className="hidden min-w-0 flex-1 items-center gap-2 md:flex">
            {breadcrumb ?? (
              <h1 className="truncate text-lg font-semibold">{title}</h1>
            )}
          </div>
          <div className="relative ml-auto hidden md:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Pesquisar aluno, turma, curso..."
              className="h-9 w-72 rounded-full border-border/70 bg-muted/60 pl-9"
            />
          </div>
          <button
            aria-label="Notificações"
            className="grid h-9 w-9 place-items-center rounded-full border border-border/70 bg-card text-muted-foreground transition hover:text-foreground"
          >
            <Bell className="h-4 w-4" />
          </button>
          {actions}
        </header>
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
          {title && (
            <h1 className="mb-6 text-2xl font-bold tracking-tight md:hidden">
              {title}
            </h1>
          )}
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}