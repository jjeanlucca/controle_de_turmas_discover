import { createLazyFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'
import { Loader2, Eye, EyeOff } from 'lucide-react'

export const Route = createLazyFileRoute('/login' as never)({
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !password) {
      toast.error('Preencha todos os campos.')
      return
    }

    if (!isValidEmail(email)) {
      toast.error('Por favor, insira um endereço de e-mail válido.')
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(), 
        password,
      })

      if (error) {
        toast.error('Credenciais inválidas. Verifique e tente novamente.')
      } else {
        toast.success('Bem-vindo de volta!')
        navigate({ to: '/' } as any)
      }
    } catch (err) {
      toast.error('Erro de conexão. Tente novamente mais tarde.')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = () => {
    toast.info('Em breve você poderá recuperar sua senha por aqui.')
  }

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* BACKGROUND */}
      <div className="absolute inset-0 z-0 overflow-hidden bg-slate-900">
        <img 
          src="/img/background.png" 
          alt="Fundo Escola Discover" 
          className="w-full h-full object-cover opacity-70" 
        />
        <div className="absolute inset-0 bg-black/40"></div>
      </div>

      {/* LOGO */}
      <div className="w-full sm:mx-auto sm:max-w-md relative z-10">
        <div className="flex justify-center">
          <img 
            src="/img/logo_branca.png" 
            alt="Logo Discover" 
            className="h-16 sm:h-20 w-auto object-contain drop-shadow-md brightness-110" 
          />
        </div>
      </div>

      {/* CARTÃO DE LOGIN */}
      <div className="mt-6 w-full sm:mx-auto sm:max-w-md relative z-10">
        <div className="bg-black/75 backdrop-blur-xl py-7 px-6 sm:px-8 rounded-xl border border-white/10 shadow-2xl shadow-black/40 mx-auto w-full max-w-[420px] sm:max-w-none">
          <form className="space-y-5" onSubmit={handleLogin} noValidate>
            <div>
              <label className="block text-sm font-semibold text-white mb-1.5">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full px-4 py-2.5 bg-white/5 border border-white/15 rounded-lg outline-none focus:border-[#6c47e6] focus:ring-4 focus:ring-[#6c47e6]/20 sm:text-sm text-sm text-white placeholder-gray-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-white mb-1.5">
                Senha
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'} 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full px-4 pr-10 py-2.5 bg-white/5 border border-white/15 rounded-lg outline-none focus:border-[#6c47e6] focus:ring-4 focus:ring-[#6c47e6]/20 sm:text-sm text-sm text-white placeholder-gray-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-[#a78bfa] transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <p className="text-sm text-gray-300">
                Esqueceu sua senha?{' '}
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-[#a78bfa] hover:text-[#c4b5fd] font-semibold transition-colors"
                >
                  Clique aqui
                </button>
              </p>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 px-6 py-2 rounded-lg border-2 border-[#a78bfa] text-[#a78bfa] font-semibold text-sm hover:bg-[#a78bfa] hover:text-gray-900 active:bg-[#8b6ef0] transition-colors disabled:opacity-60 disabled:cursor-not-allowed shrink-0"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'login'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}