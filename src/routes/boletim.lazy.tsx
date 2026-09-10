import { createLazyFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import React from 'react'
import { supabase } from '../lib/supabase'
import { Search, GraduationCap, Award, FileText, AlertCircle, CheckCircle, Clock, Filter, Layers, ChevronDown, Loader2 } from 'lucide-react'

export const Route = createLazyFileRoute('/boletim' as never)({
  component: BoletimPage,
})

interface Aluno {
  id: string
  nome: string
}

interface Turma {
  id: string
  nome: string
}

interface TurmaAluno {
  aluno_id: string
  turma_id: string
}

interface BoletimItem {
  atividade_id: string
  titulo: string
  prazo?: string
  status: string
  nota: number | null
}

function BoletimPage() {
  // Dados brutos
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [turmas, setTurmas] = useState<Turma[]>([])
  const [turmaAlunos, setTurmaAlunos] = useState<TurmaAluno[]>([])
  
  // Controles de Seleção Superior
  const [selectedTurmaId, setSelectedTurmaId] = useState<string>('')
  const [selectedAlunoId, setSelectedAlunoId] = useState<string>('')
  
  // Controles da Tabela (Filtros da Tarefa)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('Todos')
  
  // Estados do Boletim
  const [loading, setLoading] = useState(false)
  const [boletim, setBoletim] = useState<BoletimItem[]>([])
  const [media, setMedia] = useState<number | null>(null)
  const [totalEntregues, setTotalEntregues] = useState(0)
  const [totalAtrasados, setTotalAtrasados] = useState(0)

  // 1. Carrega as listas de alunos e turmas ao abrir a tela
  useEffect(() => {
    const fetchInitialData = async () => {
      const { data: turmasData } = await supabase.from('turmas').select('id, nome').order('nome')
      const { data: alunosData } = await supabase.from('alunos').select('id, nome').order('nome')
      const { data: relacoesData } = await supabase.from('turma_alunos').select('aluno_id, turma_id')
      
      setTurmas(turmasData || [])
      setAlunos(alunosData || [])
      setTurmaAlunos(relacoesData || [])
    }
    fetchInitialData()
  }, [])

  // Limpa o aluno selecionado se trocar a turma (e o aluno não pertencer a ela)
  useEffect(() => {
    if (selectedTurmaId && selectedAlunoId) {
      const pertence = turmaAlunos.some(ta => ta.aluno_id === selectedAlunoId && ta.turma_id === selectedTurmaId)
      if (!pertence) setSelectedAlunoId('')
    }
  }, [selectedTurmaId])

  // Lógica para filtrar a lista de alunos baseada na Turma selecionada
  const alunosFiltrados = alunos.filter(aluno => {
    if (!selectedTurmaId) return true
    return turmaAlunos.some(ta => ta.aluno_id === aluno.id && ta.turma_id === selectedTurmaId)
  })

  // Lógica para filtrar a tabela de atividades baseada na Busca e no Status
  const boletimFiltrado = boletim.filter(item => {
    const matchBusca = item.titulo.toLowerCase().includes(searchTerm.toLowerCase())
    const matchStatus = statusFilter === 'Todos' || item.status === statusFilter
    return matchBusca && matchStatus
  })

  // 2. Carrega o boletim sempre que um aluno for selecionado
  useEffect(() => {
    const fetchBoletim = async () => {
      if (!selectedAlunoId) {
        setBoletim([])
        return
      }
      setLoading(true)

      // A. Descobrir de quais turmas o aluno participa
      const { data: turmasAluno } = await supabase
        .from('turma_alunos')
        .select('turma_id')
        .eq('aluno_id', selectedAlunoId)
      
      const turmaIds = turmasAluno?.map((t: any) => t.turma_id) || []

      // B. Buscar as atividades (Gerais ou das turmas do aluno)
      let query = supabase.from('atividades').select('*')
      if (turmaIds.length > 0) {
        // Busca atividades da turma do aluno OU atividades sem turma (Gerais)
        query = query.or(`turma_id.in.(${turmaIds.join(',')}),turma_id.is.null`)
      } else {
        query = query.is('turma_id', null)
      }
      const { data: atividadesData } = await query

      // C. Buscar as entregas/notas que o professor já registrou para este aluno
      const { data: entregasData } = await supabase
        .from('entregas')
        .select('*')
        .eq('aluno_id', selectedAlunoId)

      // D. Cruzar os dados (Planilha Inteligente Reversa)
      const boletimGerado: BoletimItem[] = []
      let somaNotas = 0
      let qtdNotas = 0
      let entregues = 0
      let atrasados = 0

      const hoje = new Date()

      atividadesData?.forEach((ativ: any) => {
        const entrega = entregasData?.find((e: any) => e.atividade_id === ativ.id)
        
        let status = entrega?.status || 'Pendente'
        
        // Regra do atraso automático se não tiver entrega salva e passou do prazo
        if (!entrega && ativ.prazo) {
          const prazoDate = new Date(ativ.prazo + 'T23:59:59')
          if (hoje > prazoDate) status = 'Atrasado'
        }

        if (status === 'Entregue') entregues++
        if (status === 'Atrasado') atrasados++

        if (entrega?.nota !== null && entrega?.nota !== undefined) {
          somaNotas += Number(entrega.nota)
          qtdNotas++
        }

        boletimGerado.push({
          atividade_id: ativ.id,
          titulo: ativ.titulo,
          prazo: ativ.prazo,
          status: status,
          nota: entrega?.nota !== undefined ? entrega.nota : null
        })
      })

      // Atualiza os estados
      setBoletim(boletimGerado)
      setMedia(qtdNotas > 0 ? Number((somaNotas / qtdNotas).toFixed(1)) : null)
      setTotalEntregues(entregues)
      setTotalAtrasados(atrasados)
      
      setLoading(false)
    }

    fetchBoletim()
  }, [selectedAlunoId])

  return (
    <div className="min-h-screen bg-gray-50/60">
      <div className="p-4 sm:p-6 md:p-10 max-w-7xl mx-auto space-y-6 md:space-y-8">

        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 pb-6 md:pb-7 border-b border-gray-200">
          <div className="w-12 h-12 rounded-2xl bg-[#6c47e6] flex items-center justify-center shadow-sm shadow-[#6c47e6]/20 shrink-0">
            <GraduationCap className="w-6 h-6 text-white" strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Desempenho & Boletim</h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Acompanhe as notas, entregas e a média geral individual de cada aluno</p>
          </div>
        </div>

        {/* Seletor de aluno */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Pesquisar aluno</label>
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={selectedAlunoId}
              onChange={(e) => setSelectedAlunoId(e.target.value)}
              className="w-full h-11 appearance-none border border-gray-200 rounded-xl pl-10 pr-9 outline-none focus:border-[#6c47e6] focus:ring-4 focus:ring-[#6c47e6]/10 transition-all text-sm bg-white cursor-pointer truncate"
            >
              <option value="">Selecione um aluno para gerar o boletim...</option>
              {alunos.map(a => (
                <option key={a.id} value={a.id}>{a.nome}</option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Exibição do boletim */}
        {!selectedAlunoId ? (
          <div className="bg-white border border-dashed border-gray-300 rounded-2xl py-12 md:py-20 px-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center mx-auto mb-4">
              <GraduationCap className="w-6 h-6 text-gray-300" />
            </div>
            <h3 className="text-base font-semibold text-gray-800">Nenhum aluno selecionado</h3>
            <p className="text-gray-500 text-sm mt-1">Escolha um aluno acima para visualizar suas notas e desempenho.</p>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 md:py-24 text-gray-400">
            <Loader2 className="w-7 h-7 animate-spin text-[#6c47e6]" />
            <p className="text-sm">Calculando médias e buscando tarefas...</p>
          </div>
        ) : (
          <div className="space-y-6">

            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 flex items-center gap-4 hover:border-gray-300 hover:shadow-md transition-all duration-200">
                <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Média geral</p>
                  <h4 className="text-2xl font-bold text-gray-900 mt-0.5">
                    {media !== null ? media : '--'}
                  </h4>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 flex items-center gap-4 hover:border-gray-300 hover:shadow-md transition-all duration-200">
                <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Tarefas entregues</p>
                  <h4 className="text-2xl font-bold text-gray-900 mt-0.5">{totalEntregues}</h4>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 flex items-center gap-4 hover:border-gray-300 hover:shadow-md transition-all duration-200 sm:col-span-2 md:col-span-1">
                <div className="w-11 h-11 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Tarefas atrasadas</p>
                  <h4 className="text-2xl font-bold text-red-600 mt-0.5">{totalAtrasados}</h4>
                </div>
              </div>
            </div>

            {/* Tabela de atividades */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-400" />
                <h3 className="text-sm font-semibold text-gray-800">Histórico de atividades</h3>
              </div>

              {boletim.length === 0 ? (
                <div className="py-12 sm:py-16 text-center text-gray-500 text-sm">Este aluno ainda não possui atividades atribuídas.</div>
              ) : (
                <div className="w-full overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs font-medium">
                        <th className="py-3.5 px-4 sm:px-6">Atividade</th>
                        <th className="py-3.5 px-4 sm:px-6">Prazo</th>
                        <th className="py-3.5 px-4 sm:px-6">Status</th>
                        <th className="py-3.5 px-4 sm:px-6 text-right">Nota</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                      {boletim.map((item) => (
                        <tr key={item.atividade_id} className="hover:bg-gray-50/60 transition-colors">
                          <td className="py-3.5 px-4 sm:px-6 font-medium text-gray-900">{item.titulo}</td>
                          <td className="py-3.5 px-4 sm:px-6 text-gray-500">
                            {item.prazo ? (
                              <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                                <Clock className="w-3.5 h-3.5 text-gray-400" />
                                {new Date(item.prazo + 'T12:00:00').toLocaleDateString('pt-BR')}
                              </span>
                            ) : '-'}
                          </td>
                          <td className="py-3.5 px-4 sm:px-6">
                            <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap ${
                              item.status === 'Entregue' ? 'bg-[#f3efff] text-[#6c47e6]' :
                              item.status === 'Pendente' ? 'bg-amber-50 text-amber-600' :
                              'bg-red-50 text-red-600'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 sm:px-6 text-right font-semibold text-gray-900">
                            {item.nota !== null ? item.nota : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  )
}