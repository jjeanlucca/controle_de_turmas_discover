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
  Menu // <-- Ícone do hambúrguer
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
  useSidebar // <-- Hook importado para controlar o abrir/fechar
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
  
  // Pegamos a função de abrir e fechar a sidebar
  const { toggleSidebar } = useSidebar();

  const isActive = (url: string) =>
    url === "/" ? pathname === "/" : pathname === url || pathname.startsWith(url + "/");

  useEffect(() => {
    const fetchPerfil = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data } = await supabase
        .from('profiles')
        .select('nome, role, email')
        .eq('id', session.user.id)
        .single();

      if (data) {
        setPerfil({
          nome: data.nome,
          cargo: data.role,
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
      
      <SidebarHeader className="border-b border-slate-200">
        <div className="flex items-center justify-between px-2 py-3">
          
          <div className="flex items-center gap-3">
            {/* Logo inserida aqui */}
            <div className="flex h-9 shrink-0 items-center justify-center">
              <img 
                src="/img/logo_azul.png" 
                alt="Logo Discover" 
                className="h-8 w-auto object-contain"
              />
            </div>
            
            <div className="min-w-0 group-data-[collapsible=icon]:hidden">
              <p className="truncate text-sm font-semibold leading-none text-slate-900">
                Discover
              </p>
              <p className="truncate text-xs text-slate-500 mt-0.5">
                Escola de Tecnologia
              </p>
            </div>
          </div>

          {/* Botão Hambúrguer para abrir/fechar */}
          <button 
            onClick={toggleSidebar}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors group-data-[collapsible=icon]:hidden"
            title="Recolher menu"
          >
            <Menu className="h-5 w-5" />
          </button>

        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegação</SidebarGroupLabel>
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
                      <Link to={item.url as any} className="flex items-center gap-3">
                        <Icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-slate-200">
        <div className="flex items-center justify-between px-2 py-2">
          
          <div className="flex items-center gap-3 min-w-0">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#eeeaff] text-[#6c47e6] text-xs font-bold uppercase">
              {perfil ? getInitiais(perfil.nome, perfil.email) : '...'}
            </div>
            
            <div className="min-w-0 group-data-[collapsible=icon]:hidden">
              <p className="truncate text-sm font-medium leading-none text-slate-900">
                {perfil?.nome || "Carregando..."}
              </p>
              <p className="truncate text-xs text-slate-500 mt-1 capitalize">
                {perfil?.cargo === 'admin' ? 'Administrador' : (perfil?.cargo || "Professor")}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            title="Sair do Sistema"
            className="group-data-[collapsible=icon]:hidden p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors outline-none"
          >
            <LogOut className="h-4 w-4" />
          </button>
          
        </div>
      </SidebarFooter>
      
    </Sidebar>
  );
}