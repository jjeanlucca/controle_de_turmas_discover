import { createRootRoute, Outlet } from '@tanstack/react-router'
// Usando caminhos relativos diretos (../) no lugar de (@/) para o Vercel não se perder
import { AppSidebar } from '../components/app-sidebar'
import { SidebarProvider, SidebarTrigger } from '../components/ui/sidebar'

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-gray-50 text-gray-900 font-sans">
        <AppSidebar />
        
        <main className="flex-1 flex flex-col h-screen overflow-hidden">
          <div className="p-4 md:hidden border-b bg-white">
            <SidebarTrigger />
          </div>
          
          <div className="flex-1 overflow-y-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}