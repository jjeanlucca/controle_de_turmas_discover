import { createRootRoute, Outlet } from '@tanstack/react-router'
import { AppSidebar } from '@/components/app-sidebar'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import '../styles.css' // Importando o Tailwind para tudo ganhar cor!

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-gray-50 text-gray-900 font-sans">
        {/* Nossa Sidebar que corrigimos mais cedo */}
        <AppSidebar />
        
        {/* Área principal onde o conteúdo das páginas vai renderizar */}
        <main className="flex-1 flex flex-col h-screen overflow-hidden">
          {/* Botão de abrir/fechar a sidebar no mobile */}
          <div className="p-4 md:hidden border-b bg-white">
            <SidebarTrigger />
          </div>
          
          {/* O "Outlet" é onde as rotas como /turmas e / vão aparecer */}
          <div className="flex-1 overflow-y-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}