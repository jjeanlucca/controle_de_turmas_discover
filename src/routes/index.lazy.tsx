import { createLazyFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import React from 'react'
import { supabase } from '../lib/supabase'
import { Users, Layers, BookOpen, CheckSquare, ArrowUpRight, Sparkles } from 'lucide-react'

export const Route = createLazyFileRoute('/' as any)({
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
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Banner de Boas-Vindas */}
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 rounded-3xl p-8 md:p-10 text-white shadow-xl">
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-emerald-600/25 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-emerald-800/80 text-emerald-200 rounded-full text-xs font-semibold backdrop-blur-sm border border-emerald-700/50">
            <Sparkles className="w-3.5 h-3.5" /> Painel de Controle Escolar
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            Escola Discover 🚀
          </h1>
          <p className="text-emerald-100 max-w-2xl text-sm md:text-base leading-relaxed">
            Gerencie suas turmas, acompanhe o avanço dos alunos na trilha de aulas e faça disparos rápidos de conteúdos direto no WhatsApp.
          </p>
        </div>
      </div>

      {/* Cartões de Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200/80 flex items-center justify-between hover:shadow-md transition-shadow">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total de Turmas</p>
            <h3 className="text-3xl font-extrabold text-gray-900">{loading ? '...' : stats.turmas}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200/80 flex items-center justify-between hover:shadow-md transition-shadow">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Alunos Matriculados</p>
            <h3 className="text-3xl font-extrabold text-gray-900">{loading ? '...' : stats.alunos}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200/80 flex items-center justify-between hover:shadow-md transition-shadow">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Aulas na Biblioteca</p>
            <h3 className="text-3xl font-extrabold text-gray-900">{loading ? '...' : stats.conteudos}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200/80 flex items-center justify-between hover:shadow-md transition-shadow">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Atividades Cadastradas</p>
            <h3 className="text-3xl font-extrabold text-gray-900">{loading ? '...' : stats.atividades}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <CheckSquare className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Atalhos Rápidos */}
      <div className="space-y-4 pt-2">
        <h2 className="text-xl font-bold text-gray-900 tracking-tight">Acesso Rápido aos Módulos</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Link
            to={"/turmas" as any}
            className="group bg-white p-6 rounded-2xl shadow-sm border border-gray-200/80 hover:border-emerald-500 hover:shadow-md transition-all flex flex-col justify-between space-y-6"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">Gerenciar Turmas</h3>
              <p className="text-sm text-gray-500">Cadastre novas turmas e controle o avanço semestral das aulas e matérias.</p>
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
              Acessar módulo <ArrowUpRight className="w-4 h-4" />
            </div>
          </Link>

          <Link
            to={"/alunos" as any}
            className="group bg-white p-6 rounded-2xl shadow-sm border border-gray-200/80 hover:border-blue-500 hover:shadow-md transition-all flex flex-col justify-between space-y-6"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">Gestão de Alunos</h3>
              <p className="text-sm text-gray-500">Visualize estudantes matriculados e altere vínculos com turmas de forma rápida.</p>
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold text-blue-600">
              Acessar módulo <ArrowUpRight className="w-4 h-4" />
            </div>
          </Link>

          <Link
            to={"/biblioteca" as any}
            className="group bg-white p-6 rounded-2xl shadow-sm border border-gray-200/80 hover:border-purple-500 hover:shadow-md transition-all flex flex-col justify-between space-y-6"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-purple-600 transition-colors">Biblioteca & WhatsApp</h3>
              <p className="text-sm text-gray-500">Consulte aulas, livros digitais, jogos interativos e dispare links no WhatsApp.</p>
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold text-purple-600">
              Acessar módulo <ArrowUpRight className="w-4 h-4" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}