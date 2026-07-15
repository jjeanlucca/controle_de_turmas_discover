import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/configuracoes")({
  component: Configuracoes,
});

function Configuracoes() {
  return (
    <AppShell title="Configurações">
      <div className="mb-6">
        <h1 className="hidden text-2xl font-bold tracking-tight md:block">
          Configurações
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ajuste seu perfil e as preferências do sistema.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="rounded-2xl border-border/60 p-6">
          <p className="text-sm font-semibold">Perfil do professor</p>
          <div className="mt-4 space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="nome">Nome</Label>
              <Input id="nome" defaultValue="Marcos Andrade" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" defaultValue="marcos@escoladiscover.com.br" />
            </div>
            <Button className="rounded-xl">Salvar alterações</Button>
          </div>
        </Card>

        <Card className="rounded-2xl border-border/60 p-6">
          <p className="text-sm font-semibold">Preferências</p>
          <div className="mt-4 space-y-4">
            <Row label="Notificações por e-mail" hint="Resumo semanal de entregas" defaultChecked />
            <Row label="Cálculo automático de médias" hint="Sempre ativo" defaultChecked disabled />
            <Row label="Modo compacto" hint="Menos espaçamento nas tabelas" />
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

function Row({
  label,
  hint,
  defaultChecked,
  disabled,
}: {
  label: string;
  hint?: string;
  defaultChecked?: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 p-3">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      <Switch defaultChecked={defaultChecked} disabled={disabled} />
    </div>
  );
}