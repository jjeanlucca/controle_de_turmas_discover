import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  User, 
  ListChecks,
  BarChart3,
  Settings,
  LogOut,
  Layers,
  TrendingUp,
  Menu
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar
} from "./ui/sidebar";

const nav = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Alunos", url: "/alunos", icon: User },
  { title: "Turmas", url: "/turmas", icon: Layers },
  { title: "Biblioteca", url: "/biblioteca", icon: BookOpen },
  { title: "Controle de Tarefas", url: "/tarefas", icon: ListChecks },
  { title: "Desempenho", url: "/boletim", icon: TrendingUp },
  { title: "Relatórios", url: "/relatorios", icon: BarChart3 },
  { title: "Configurações", url: "/configuracoes", icon: Settings },
] as const;

export function AppSidebar() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const navigate = useNavigate();
  const [perfil, setPerfil] = useState<{ nome: string; cargo: string; email: string } | null>(null);

  const { toggleSidebar } = useSidebar();

  const isActive = (url: string) =>
    url === "/" ? pathname === "/" : pathname === url || pathname.startsWith(url + "/");

  useEffect(() => {
    const fetchPerfil = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data } = await supabase
        .from('perfis')
        .select('nome, cargo, email')
        .eq('id', session.user.id)
        .single();

      if (data) {
        setPerfil({
          nome: data.nome,
          cargo: data.cargo,
          email: data.email
        });
      }
    };

    fetchPerfil();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: '/login' as never });
  };

  const getInitiais = (nome?: string, email?: string) => {
    if (nome) {
      const partes = nome.trim().split(" ");
      if (partes.length >= 2) {
        return (partes[0][0] + partes[1][0]).toUpperCase();
      }
      return partes[0].substring(0, 2).toUpperCase();
    }
    if (email) {
      return email.substring(0, 2).toUpperCase();
    }
    return "US";
  };

  return (
    <Sidebar collapsible="icon">
      
      <SidebarHeader className="border-b border-slate-200 h-[72px] p-0 flex flex-col justify-center">
        <div className="flex items-center justify-between px-4 w-full">
          
          <div className="flex shrink-0 items-center group-data-[collapsible=icon]:hidden">
            <img 
              src="/img/logo_azul.png" 
              alt="Logo Discover" 
              className="h-8 w-auto object-contain"
            />
          </div>

          <button 
            onClick={toggleSidebar}
            className="p-2 text-slate-400 hover:text-[#6c47e6] hover:bg-[#eeeaff] rounded-lg transition-colors shrink-0 group-data-[collapsible=icon]:mx-auto"
            title="Alternar menu"
          >
            <Menu className="h-5 w-5" />
          </button>

        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          {/* Adicionado o hidden para o título NAVEGAÇÃO sumir também */}
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">
            Navegação
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {nav.map((item) => {
                const Icon = item.icon;
                
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.url)}
                      tooltip={item.title}
                    >
                      {/* O link se ajusta e o texto <span> se esconde ao encolher */}
                      <Link 
                        to={item.url as any} 
                        className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
                      >
                        <Icon className="h-5 w-5 shrink-0" />
                        <span className="group-data-[collapsible=icon]:hidden">
                          {item.title}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-slate-200 p-0">
        <div className="flex items-center justify-between p-4 w-full">
          
          <div className="flex items-center gap-3 min-w-0">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#eeeaff] text-[#6c47e6] text-xs font-bold uppercase group-data-[collapsible=icon]:mx-auto">
              {perfil ? getInitiais(perfil.nome, perfil.email) : '...'}
            </div>
            
            <div className="min-w-0 group-data-[collapsible=icon]:hidden">
              <p className="truncate text-sm font-semibold leading-none text-slate-900">
                {perfil?.nome || "Carregando..."}
              </p>
              <p className="truncate text-xs text-slate-500 mt-0.5 capitalize">
                {perfil?.cargo === 'admin' ? 'Administrador' : (perfil?.cargo || "Professor")}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            title="Sair do Sistema"
            className="group-data-[collapsible=icon]:hidden p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors outline-none shrink-0"
          >
            <LogOut className="h-5 w-5" />
          </button>
          
        </div>
      </SidebarFooter>
      
    </Sidebar>
  );
}