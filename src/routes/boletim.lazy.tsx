import { createLazyFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import React from 'react'
import { supabase } from '../lib/supabase'
import { Search, GraduationCap, Award, FileText, AlertCircle, CheckCircle, Clock, Filter, Layers } from 'lucide-react'

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

  // 2. Carrega o boletim sempre que um aluno for selecionado
  useEffect(() => {
    const fetchBoletim = async () => {
      if (!selectedAlunoId) {
        setBoletim([])
        return
      }
      setLoading(true)

      const { data: turmasDoAluno } = await supabase
        .from('turma_alunos')
        .select('turma_id')
        .eq('aluno_id', selectedAlunoId)
      
      const turmaIds = turmasDoAluno?.map((t: any) => t.turma_id) || []

      let query = supabase.from('atividades').select('*')
      if (turmaIds.length > 0) {
        query = query.or(`turma_id.in.(${turmaIds.join(',')}),turma_id.is.null`)
      } else {
        query = query.is('turma_id', null)
      }
      const { data: atividadesData } = await query

      const { data: entregasData } = await supabase
        .from('entregas')
        .select('*')
        .eq('aluno_id', selectedAlunoId)

      const boletimGerado: BoletimItem[] = []
      let somaNotas = 0
      let qtdNotas = 0
      let entregues = 0
      let atrasados = 0
      const hoje = new Date()

      atividadesData?.forEach((ativ: any) => {
        const entrega = entregasData?.find((e: any) => e.atividade_id === ativ.id)
        let status = entrega?.status || 'Pendente'
        
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

      setBoletim(boletimGerado)
      setMedia(qtdNotas > 0 ? Number((somaNotas / qtdNotas).toFixed(1)) : null)
      setTotalEntregues(entregues)
      setTotalAtrasados(atrasados)
      setLoading(false)
    }

    fetchBoletim()
  }, [selectedAlunoId])

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
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Cabeçalho */}
      <div className="border-b pb-6">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Desempenho & Boletim</h1>
        <p className="text-gray-500 mt-1">Acompanhe as notas, entregas e a média geral individual de cada aluno.</p>
      </div>

      {/* Seletor de Aluno */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="w-full md:w-1/2 flex items-center gap-3">
          <div className="w-12 h-12 bg-[#eeeaff] text-[#6c47e6] rounded-xl flex items-center justify-center shrink-0">
            <Search className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Pesquisar Aluno</label>
            <select
              value={selectedAlunoId}
              onChange={(e) => setSelectedAlunoId(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#845ef7] text-sm bg-white cursor-pointer transition-all"
            >
              <option value="">Selecione um aluno para gerar o boletim...</option>
              {alunos.map(a => (
                <option key={a.id} value={a.id}>{a.nome}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Exibição do Boletim */}
      {!selectedAlunoId ? (
        <div className="bg-gray-50 border border-dashed border-gray-300 rounded-2xl p-16 text-center space-y-4">
          <GraduationCap className="w-16 h-16 text-gray-300 mx-auto" />
          <div>
            <h3 className="text-xl font-bold text-gray-700">Nenhum aluno selecionado</h3>
            <p className="text-gray-500 text-sm mt-1">Escolha um aluno acima para visualizar suas notas e desempenho.</p>
          </div>
        </div>
      ) : loading ? (
        <div className="text-center py-12 text-gray-500">Calculando médias e buscando tarefas...</div>
      ) : (
        <div className="space-y-6">
          
          {/* Cards de Resumo (KPIs) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
                <Award className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Média Geral</p>
                <h4 className="text-3xl font-extrabold text-gray-900">
                  {media !== null ? media : '--'}
                </h4>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Tarefas Entregues</p>
                <h4 className="text-3xl font-extrabold text-gray-900">{totalEntregues}</h4>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Tarefas Atrasadas</p>
                <h4 className="text-3xl font-extrabold text-gray-900 text-red-600">{totalAtrasados}</h4>
              </div>
            </div>
          </div>

          {/* Tabela de Atividades */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center gap-2">
              <FileText className="w-5 h-5 text-gray-500" />
              <h3 className="text-lg font-bold text-gray-800">Histórico de Atividades</h3>
            </div>
            
            {boletim.length === 0 ? (
              <div className="p-8 text-center text-gray-500">Este aluno ainda não possui atividades atribuídas.</div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wider font-semibold">
                    <th className="py-4 px-6">Atividade</th>
                    <th className="py-4 px-6">Prazo</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6 text-right">Nota</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                  {boletim.map((item) => (
                    <tr key={item.atividade_id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 px-6 font-medium text-gray-900">{item.titulo}</td>
                      <td className="py-4 px-6 text-gray-500">
                        {item.prazo ? (
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(item.prazo + 'T12:00:00').toLocaleDateString('pt-BR')}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                          item.status === 'Entregue' ? 'bg-[#eeeaff] text-[#6c47e6]' :
                          item.status === 'Pendente' ? 'bg-amber-50 text-amber-600' :
                          'bg-red-50 text-red-600'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right font-extrabold text-lg text-gray-900">
                        {item.nota !== null ? item.nota : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

        </div>
      )}
    </div>
  )
}