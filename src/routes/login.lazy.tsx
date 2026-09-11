import { createLazyFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'
import { Loader2, Lock, Mail, Eye, EyeOff } from 'lucide-react'

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

      {/* CABEÇALHO DA TELA */}
      <div className="w-full sm:mx-auto sm:max-w-md relative z-10">
        <div className="flex justify-center">
        <img 
          src="/img/logo_branca.png" 
          alt="Logo Discover" 
          className="h-40 sm:h-48 w-auto object-contain drop-shadow-md brightness-110" 
        />
      </div>
        {/* Margem superior devolvida (mt-4) para um espaçamento harmonioso */}
        <p className="mt-4 text-center text-sm font-medium tracking-wide text-slate-200 drop-shadow-sm">
          Acesse o painel de controle educacional
        </p>
      </div>

      {/* FORMULÁRIO */}
      <div className="mt-6 w-full sm:mx-auto sm:max-w-md relative z-10">
        <div className="bg-white/95 backdrop-blur-xl py-8 px-6 shadow-2xl shadow-black/30 rounded-2xl sm:px-10 border border-white/20 mx-auto w-full max-w-[400px] sm:max-w-none">
          <form className="space-y-5" onSubmit={handleLogin} noValidate>
            <div>
              <label className="block text-sm font-medium tracking-wide text-gray-700 mb-1.5">
                E-mail
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-[#6c47e6] focus:ring-4 focus:ring-[#6c47e6]/10 sm:text-sm transition-all bg-white"
                  placeholder="professor@escola.com"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium tracking-wide text-gray-700">
                  Senha
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-sm font-medium tracking-tight text-[#6c47e6] hover:text-[#5533c7] transition-colors"
                >
                  Esqueci minha senha
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'} 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-[#6c47e6] focus:ring-4 focus:ring-[#6c47e6]/10 sm:text-sm transition-all bg-white"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-[#6c47e6] transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-2.5 px-4 rounded-xl shadow-sm text-sm font-semibold tracking-wide text-white bg-[#6c47e6] hover:bg-[#5533c7] active:bg-[#4a2bb0] focus:outline-none focus:ring-4 focus:ring-[#6c47e6]/20 transition-colors disabled:opacity-70 disabled:cursor-not-allowed mt-4"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Entrar no sistema'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}