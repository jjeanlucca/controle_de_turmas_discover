import { createRootRoute, Outlet, useLocation, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { AppSidebar } from '../components/app-sidebar'
import { SidebarProvider, SidebarTrigger } from '../components/ui/sidebar'
import { Toaster } from 'sonner'
import { supabase } from '../lib/supabase'
import { Loader2 } from 'lucide-react'

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  
  const [isLoading, setIsLoading] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(null)

  const isLoginPage = location.pathname === '/login'

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // 1. Verifica se tem alguém logado
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
          // Se não tem sessão e não está na página de login, expulsa pro login
          if (!isLoginPage) {
            navigate({ to: '/login' } as never)
          }
          setIsLoading(false)
          return
        }

        // 2. Se tem sessão e tentou acessar o login, manda pro dashboard
        if (session && isLoginPage) {
          navigate({ to: '/' } as never)
        }

        // 3. Busca o cargo do usuário na tabela de perfis
        const { data: perfil } = await supabase
          .from('perfis')
          .select('cargo')
          .eq('id', session.user.id)
          .single()

        if (perfil) {
          setUserRole(perfil.cargo)
        }
        
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()

    // Configura o ouvinte para mudanças de login/logout em tempo real
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session && !isLoginPage) {
        navigate({ to: '/login' } as never)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [isLoginPage, navigate])

  // Tela de carregamento enquanto o Supabase verifica o token
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
        <p className="mt-4 text-gray-500 text-sm font-medium animate-pulse">
          Verificando credenciais...
        </p>
      </div>
    )
  }

  return (
    <>
      {isLoginPage ? (
        <Outlet />
      ) : (
        <SidebarProvider>
          <div className="flex min-h-screen w-full bg-gray-50 text-gray-900 font-sans">
            {/* Você pode passar o userRole para a sidebar depois se quiser esconder links nela */}
            <AppSidebar />
            
            <main className="flex-1 flex flex-col h-screen overflow-hidden">
              <div className="p-4 md:hidden border-b bg-white">
                <SidebarTrigger />
              </div>
              
              <div className="flex-1 overflow-y-auto">
                {/* O Outlet renderiza as páginas filhas (Dashboard, Turmas, etc) */}
                <Outlet />
              </div>
            </main>
          </div>
        </SidebarProvider>
      )}
      
      <Toaster richColors position="top-right" />
    </>
  )
}