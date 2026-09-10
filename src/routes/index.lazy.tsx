import { createLazyFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import React from 'react'
import { supabase } from '../lib/supabase'
import { Users, Layers, BookOpen, CheckSquare, ArrowUpRight, Sparkles } from 'lucide-react'

// Correção 1: 'as never' na rota
export const Route = createLazyFileRoute('/' as never)({
  component: DashboardPage,
})

function DashboardPage() {
  const [stats, setStats] = useState({
    turmas: 0,
    alunos: 0,
    conteudos: 0,
    atividades: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [turmasRes, alunosRes, conteudosRes, atividadesRes] = await Promise.all([
          supabase.from('turmas').select('*', { count: 'exact', head: true }),
          supabase.from('alunos').select('*', { count: 'exact', head: true }),
          supabase.from('biblioteca_conteudos').select('*', { count: 'exact', head: true }),
          supabase.from('atividades').select('*', { count: 'exact', head: true }),
        ])

        setStats({
          turmas: turmasRes.count || 0,
          alunos: alunosRes.count || 0,
          conteudos: conteudosRes.count || 0,
          atividades: atividadesRes.count || 0,
        })
      } catch (error) {
        console.error('Erro ao buscar estatísticas:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50/60">
      <div className="p-4 sm:p-6 md:p-10 max-w-7xl mx-auto space-y-6 md:space-y-8">

        {/* Banner de boas-vindas */}
        <div className="relative overflow-hidden bg-gradient-to-r from-[#2c1f5c] via-[#3d2a80] to-[#241a4d] rounded-3xl p-6 sm:p-8 md:p-10 text-white shadow-xl">
          <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-[#6c47e6]/25 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-white/10 text-violet-200 rounded-full text-xs font-medium backdrop-blur-sm border border-white/10">
              <Sparkles className="w-3.5 h-3.5" /> Painel de controle escolar
            </span>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">
              Escola Discover 🚀
            </h1>
            <p className="text-violet-100 max-w-2xl text-sm md:text-base leading-relaxed">
              Gerencie suas turmas, acompanhe o avanço dos alunos na trilha de aulas e faça disparos rápidos de conteúdos direto no WhatsApp.
            </p>
          </div>
        </div>

        {/* Cartões de estatísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200 flex items-center justify-between hover:border-gray-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            <div className="space-y-1">
              <p className="text-xs sm:text-sm text-gray-500">Total de turmas</p>
              <h3 className="text-2xl font-bold text-gray-900">{loading ? '...' : stats.turmas}</h3>
            </div>
            <div className="w-11 h-11 rounded-xl bg-[#f3efff] text-[#6c47e6] flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200 flex items-center justify-between hover:border-gray-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            <div className="space-y-1">
              <p className="text-xs sm:text-sm text-gray-500">Alunos matriculados</p>
              <h3 className="text-2xl font-bold text-gray-900">{loading ? '...' : stats.alunos}</h3>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200 flex items-center justify-between hover:border-gray-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            <div className="space-y-1">
              <p className="text-xs sm:text-sm text-gray-500">Aulas na biblioteca</p>
              <h3 className="text-2xl font-bold text-gray-900">{loading ? '...' : stats.conteudos}</h3>
            </div>
            <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200 flex items-center justify-between hover:border-gray-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            <div className="space-y-1">
              <p className="text-xs sm:text-sm text-gray-500">Atividades cadastradas</p>
              <h3 className="text-2xl font-bold text-gray-900">{loading ? '...' : stats.atividades}</h3>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <CheckSquare className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Atalhos rápidos */}
        <div className="space-y-4 pt-2">
          <h2 className="text-lg font-semibold text-gray-900 tracking-tight">Acesso rápido aos módulos</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Correção 2: 'as never' nos links */}
            <Link
              to={"/turmas" as never}
              className="group bg-white p-5 sm:p-6 rounded-2xl border border-gray-200 hover:border-[#6c47e6]/40 hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-5 sm:space-y-6"
            >
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#f3efff] text-[#6c47e6] flex items-center justify-center group-hover:bg-[#6c47e6] group-hover:text-white transition-colors">
                  <Layers className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 group-hover:text-[#6c47e6] transition-colors">Gerenciar turmas</h3>
                <p className="text-xs sm:text-sm text-gray-500">Cadastre novas turmas e controle o avanço semestral das aulas e matérias.</p>
              </div>
              <div className="flex items-center gap-1 text-xs font-semibold text-[#6c47e6]">
                Acessar módulo <ArrowUpRight className="w-3.5 h-3.5" />
              </div>
            </Link>

            <Link
              to={"/alunos" as never}
              className="group bg-white p-5 sm:p-6 rounded-2xl border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-5 sm:space-y-6"
            >
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">Gestão de alunos</h3>
                <p className="text-xs sm:text-sm text-gray-500">Visualize estudantes matriculados e altere vínculos com turmas de forma rápida.</p>
              </div>
              <div className="flex items-center gap-1 text-xs font-semibold text-blue-600">
                Acessar módulo <ArrowUpRight className="w-3.5 h-3.5" />
              </div>
            </Link>

            <Link
              to={"/biblioteca" as never}
              className="group bg-white p-5 sm:p-6 rounded-2xl border border-gray-200 hover:border-indigo-400 hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-5 sm:space-y-6"
            >
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">Biblioteca & WhatsApp</h3>
                <p className="text-xs sm:text-sm text-gray-500">Consulte aulas, livros digitais, jogos interativos e dispare links no WhatsApp.</p>
              </div>
              <div className="flex items-center gap-1 text-xs font-semibold text-indigo-600">
                Acessar módulo <ArrowUpRight className="w-3.5 h-3.5" />
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}