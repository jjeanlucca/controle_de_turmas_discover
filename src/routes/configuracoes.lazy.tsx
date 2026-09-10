import { createLazyFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { createClient } from '@supabase/supabase-js'
import { User, Shield, Save, Loader2, Mail, Users, Plus, Key, Settings } from 'lucide-react'
import { toast } from 'sonner'

// ==========================================
// A ALTERNATIVA DEFINITIVA (MEMÓRIA FANTASMA)
// ==========================================
// Isso impede que o Supabase secundário encoste no cache do navegador
// e cruze as informações com a sua sessão principal de Admin.
const memoryStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
}

const supabaseAdmin = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storage: memoryStorage // Bloqueio total aplicado
    }
  }
)

export const Route = createLazyFileRoute('/configuracoes' as never)({
  component: ConfiguracoesPage,
})

function ConfiguracoesPage() {
  // Estados do Perfil Logado
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [cargo, setCargo] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Estados Administrativos
  const [equipe, setEquipe] = useState<any[]>([])
  const [novoNome, setNovoNome] = useState('')
  const [novoEmail, setNovoEmail] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [novoCargo, setNovoCargo] = useState('professor')
  const [creating, setCreating] = useState(false)
  const [resetting, setResetting] = useState<string | null>(null)

  const fetchProfileAndTeam = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { data } = await supabase
      .from('perfis')
      .select('nome, email, cargo')
      .eq('id', session.user.id)
      .single()

    if (data) {
      setNome(data.nome || '')
      setEmail(data.email || '')
      setCargo(data.cargo || '')

      // Se for admin, busca toda a equipe
      if (data.cargo === 'admin') {
        const { data: teamData } = await supabase.from('perfis').select('*').order('nome')
        if (teamData) setEquipe(teamData)
      }
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchProfileAndTeam()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    
    const { data: { session } } = await supabase.auth.getSession()
    
    if (session) {
      const { error } = await supabase
        .from('perfis')
        .update({ nome })
        .eq('id', session.user.id)

      if (error) {
        toast.error('Erro ao atualizar perfil: ' + error.message)
      } else {
        toast.success('Perfil atualizado com sucesso!')
        setTimeout(() => window.location.reload(), 1500)
      }
    }
    setSaving(false)
  }

  // Substituímos o (e: React.FormEvent) porque não é mais um form
  const handleCreateAccount = async () => {
    if (!novoNome || !novoEmail || !novaSenha) {
      toast.error('Preencha todos os campos para cadastrar o professor.')
      return
    }

    setCreating(true)
    
    try {
      // 1. Cria a conta no Auth silenciosamente
      const { data: authData, error: authError } = await supabaseAdmin.auth.signUp({
        email: novoEmail,
        password: novaSenha,
      })

      if (authError) throw authError

      // 2. Salva o perfil com UPSERT e puxando exatamente as variáveis de estado
      if (authData.user) {
        const { error: profileError } = await supabaseAdmin.from('perfis').upsert([{
          id: authData.user.id,
          nome: novoNome, 
          email: novoEmail,
          cargo: novoCargo
        }])

        if (profileError) throw profileError
      }

      // 3. Expulsa a sessão temporária para limpar a memória fantasma
      await supabaseAdmin.auth.signOut()

      toast.success('Professor adicionado com sucesso!')
      
      setNovoNome('')
      setNovoEmail('')
      setNovaSenha('')
      
      fetchProfileAndTeam() 
    } catch (error: any) {
      toast.error('Erro ao criar conta: ' + error.message)
    } finally {
      setCreating(false)
    }
  }

  const handleResetPassword = async (emailProf: string) => {
    setResetting(emailProf)
    const { error } = await supabase.auth.resetPasswordForEmail(emailProf, {
      redirectTo: window.location.origin + '/redefinir-senha',
    })

    if (error) {
      toast.error('Erro ao enviar e-mail: ' + error.message)
    } else {
      toast.success('E-mail de recuperação enviado para ' + emailProf)
    }
    setResetting(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/60 flex flex-col items-center justify-center gap-3 text-gray-400">
        <Loader2 className="w-7 h-7 animate-spin text-[#6c47e6]" />
        <p className="text-sm">Carregando configurações...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50/60">
      <div className="p-4 sm:p-6 md:p-10 max-w-4xl mx-auto space-y-6 md:space-y-8">

        <div className="flex flex-col sm:flex-row sm:items-center gap-4 pb-6 md:pb-7 border-b border-gray-200">
          <div className="w-12 h-12 rounded-2xl bg-[#6c47e6] flex items-center justify-center shadow-sm shadow-[#6c47e6]/20 shrink-0">
            <Settings className="w-6 h-6 text-white" strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Configurações</h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Gerencie suas informações pessoais e preferências do sistema</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex items-center gap-2.5">
            <User className="w-4 h-4 text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-800">Perfil profissional</h2>
          </div>

          <form onSubmit={handleSave} className="p-4 sm:p-6 space-y-5 sm:space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome de exibição</label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Prof. Marcos Silva"
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-[#6c47e6] focus:ring-4 focus:ring-[#6c47e6]/10 transition-all text-sm bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Endereço de e-mail</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    disabled
                    className="w-full border border-gray-200 bg-gray-50 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-500 cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nível de acesso</label>
                <div className="relative">
                  <Shield className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={cargo === 'admin' ? 'Administrador' : cargo}
                    disabled
                    className="w-full border border-gray-200 bg-gray-50 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-500 cursor-not-allowed capitalize"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 sm:pt-2 flex flex-col sm:flex-row justify-end border-t border-gray-100 sm:border-0 mt-4 sm:mt-0">
              <button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto inline-flex justify-center items-center gap-2 bg-[#6c47e6] hover:bg-[#5533c7] active:bg-[#4a2bb0] text-white px-5 py-2.5 rounded-xl font-medium text-sm shadow-sm transition-colors disabled:opacity-70"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'Salvando...' : 'Salvar alterações'}
              </button>
            </div>
          </form>
        </div>

        {cargo === 'admin' && (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex items-center gap-2.5">
              <Users className="w-4 h-4 text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-800">Gerenciamento de equipe</h2>
            </div>

            <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
              
              {/* O NAVEGADOR ESTÁ CEGO AQUI: Sem tag <form> e o tipo password foi mudado para texto */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 pb-2 border-b border-gray-100">Cadastrar novo professor</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <input
                    type="text"
                    placeholder="Nome do professor"
                    value={novoNome}
                    onChange={(e) => setNovoNome(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-[#6c47e6] focus:ring-4 focus:ring-[#6c47e6]/10 transition-all text-sm bg-white"
                  />
                  <input
                    type="email"
                    placeholder="E-mail profissional"
                    value={novoEmail}
                    onChange={(e) => setNovoEmail(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-[#6c47e6] focus:ring-4 focus:ring-[#6c47e6]/10 transition-all text-sm bg-white"
                  />
                  {/* Troquei para text para o Chrome não reconhecer como tela de login */}
                  <input
                    type="text" 
                    placeholder="Senha provisória"
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-[#6c47e6] focus:ring-4 focus:ring-[#6c47e6]/10 transition-all text-sm bg-white"
                  />
                  <select
                    value={novoCargo}
                    onChange={(e) => setNovoCargo(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-[#6c47e6] focus:ring-4 focus:ring-[#6c47e6]/10 transition-all text-sm bg-white cursor-pointer"
                  >
                    <option value="professor">Professor</option>
                    <option value="admin">Coordenador / admin</option>
                  </select>
                </div>
                <div className="flex flex-col sm:flex-row justify-end">
                  <button
                    onClick={handleCreateAccount}
                    disabled={creating}
                    className="w-full sm:w-auto inline-flex justify-center items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-5 py-2.5 rounded-xl font-medium text-sm shadow-sm transition-colors disabled:opacity-70"
                  >
                    {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Criar conta
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-900 pb-2 mb-4 border-b border-gray-100">Contas ativas</h3>
                <div className="space-y-3">
                  {equipe.map((membro) => (
                    <div
                      key={membro.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-gray-50 border border-gray-100 rounded-xl"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-[#f3efff] text-[#6c47e6] flex items-center justify-center font-semibold text-xs shrink-0">
                          {membro.nome?.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{membro.nome}</p>
                          <p className="text-xs text-gray-500 flex items-center gap-1.5 flex-wrap">
                            <span className="truncate">{membro.email}</span>
                            <span className="text-gray-300 hidden sm:inline">•</span>
                            <span className="text-[11px] font-medium text-[#6c47e6]">{membro.cargo}</span>
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleResetPassword(membro.email)}
                        disabled={resetting === membro.email}
                        className="w-full sm:w-auto inline-flex justify-center items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-[#6c47e6] bg-white border border-gray-200 px-3 py-2 sm:py-1.5 rounded-lg transition-colors disabled:opacity-50 shrink-0"
                      >
                        {resetting === membro.email ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Key className="w-3.5 h-3.5" />}
                        Redefinir senha
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}