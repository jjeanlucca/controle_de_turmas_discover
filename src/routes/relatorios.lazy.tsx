import { createLazyFileRoute } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { BarChart3, TrendingUp, Users, BookOpen, Download, Loader2, User } from 'lucide-react'
import { toPng } from 'html-to-image'
import { jsPDF } from 'jspdf'
import { supabase } from '../lib/supabase'

export const Route = createLazyFileRoute('/relatorios' as never)({
  component: RelatoriosPage,
})

// Tipagem para ajudar no autocompletar
type Estudante = {
  id: string
  nome: string
  turma: string
  curso: string
  ano: number
}

type NotaAluno = {
  titulo: string
  nota: number | null
  status: string
}

function RelatoriosPage() {
  const boletimRef = useRef<HTMLDivElement>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [estudantes, setEstudantes] = useState<Estudante[]>([])
  const [alunoSelecionado, setAlunoSelecionado] = useState<Estudante | null>(null)
  const [loadingDados, setLoadingDados] = useState(true)
  
  // Novos estados para carregar as notas reais do aluno selecionado
  const [notasAluno, setNotasAluno] = useState<NotaAluno[]>([])
  const [loadingNotas, setLoadingNotas] = useState(false)

  // 1. Busca os alunos reais associados ao professor logado
  useEffect(() => {
    const fetchAlunos = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      // Busca as turmas do professor e os alunos dentro do relacionamento N:N
      const { data, error } = await supabase
        .from('turmas')
        .select(`
          nome,
          ano_letivo,
          cursos ( titulo ),
          turma_alunos (
            alunos ( id, nome )
          )
        `)
        .eq('professor_id', session.user.id)

      if (data && !error) {
        const lista: Estudante[] = []
        
        // Achata a resposta do banco para uma lista simples de alunos
        data.forEach((turma: any) => {
          const nomeCurso = turma.cursos?.titulo || 'Curso não definido'
          
          turma.turma_alunos.forEach((ta: any) => {
            if (ta.alunos) {
              lista.push({
                id: ta.alunos.id,
                nome: ta.alunos.nome,
                turma: turma.nome,
                curso: nomeCurso,
                ano: turma.ano_letivo
              })
            }
          })
        })

        setEstudantes(lista)
        if (lista.length > 0) setAlunoSelecionado(lista[0])
      }
      setLoadingDados(false)
    }

    fetchAlunos()
  }, [])

  // 2. Busca as notas REAIS do aluno sempre que ele for selecionado
  useEffect(() => {
    const fetchNotasDoAluno = async () => {
      if (!alunoSelecionado) {
        setNotasAluno([])
        return
      }
      setLoadingNotas(true)

      try {
        // A. Descobrir de quais turmas o aluno participa
        const { data: turmasAluno } = await supabase
          .from('turma_alunos')
          .select('turma_id')
          .eq('aluno_id', alunoSelecionado.id)
        
        const turmaIds = turmasAluno?.map((t: any) => t.turma_id) || []

        // B. Buscar as atividades
        let query = supabase.from('atividades').select('*')
        if (turmaIds.length > 0) {
          query = query.or(`turma_id.in.(${turmaIds.join(',')}),turma_id.is.null`)
        } else {
          query = query.is('turma_id', null)
        }
        const { data: atividadesData } = await query

        // C. Buscar as entregas/notas
        const { data: entregasData } = await supabase
          .from('entregas')
          .select('*')
          .eq('aluno_id', alunoSelecionado.id)

        // D. Cruzar os dados (Mesma inteligência do Boletim)
        const hoje = new Date()
        const notasFormatadas = atividadesData?.map((ativ: any) => {
          const entrega = entregasData?.find((e: any) => e.atividade_id === ativ.id)
          let status = entrega?.status || 'Pendente'
          
          if (!entrega && ativ.prazo) {
            const prazoDate = new Date(ativ.prazo + 'T23:59:59')
            if (hoje > prazoDate) status = 'Atrasado'
          }

          return {
            titulo: ativ.titulo,
            nota: entrega?.nota !== undefined ? entrega.nota : null,
            status: status
          }
        }) || []

        setNotasAluno(notasFormatadas)
      } catch (error) {
        console.error("Erro ao buscar notas:", error)
      } finally {
        setLoadingNotas(false)
      }
    }

    fetchNotasDoAluno()
  }, [alunoSelecionado])

  const handleExportPDF = async () => {
    if (!boletimRef.current || !alunoSelecionado) return
    setIsExporting(true)

    try {
      const dataUrl = await toPng(boletimRef.current, {
        quality: 1,
        backgroundColor: '#ffffff',
        pixelRatio: 2
      })
      
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const imgProps = pdf.getImageProperties(dataUrl)
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width
      
      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight)
      pdf.save(`Relatorio_${alunoSelecionado.nome.replace(/ /g, '_')}.pdf`)
      
    } catch (error: any) {
      console.error('Erro detalhado:', error)
      alert('Erro ao gerar PDF: ' + (error.message || error))
    } finally {
      setIsExporting(false)
    }
  }

  // Se o aluno mudar no <select>, atualizamos o estado
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const aluno = estudantes.find(a => a.id === e.target.value)
    if (aluno) setAlunoSelecionado(aluno)
  }

  // Cálculos dinâmicos para o painel de resumo
  const pendencias = notasAluno.filter(n => n.status === 'Pendente' || n.status === 'Atrasado').length;

  return (
    <div className="relative min-h-screen bg-gray-50/60 overflow-hidden">
      <div className="p-4 sm:p-6 md:p-10 max-w-7xl mx-auto space-y-6 md:space-y-8">

        {/* Cabeçalho */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 md:pb-7 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#6c47e6] flex items-center justify-center shadow-sm shadow-[#6c47e6]/20 shrink-0">
              <BarChart3 className="w-6 h-6 text-white" strokeWidth={2} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Relatórios de Desempenho</h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Gere relatórios individuais para acompanhamento dos alunos</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto mt-2 md:mt-0">
            {loadingDados ? (
              <div className="flex items-center justify-center gap-2 text-sm text-gray-400 px-2 h-11">
                <Loader2 className="w-4 h-4 animate-spin" />
                Carregando alunos...
              </div>
            ) : (
              <select
                className="h-11 border border-gray-200 rounded-xl px-3.5 outline-none focus:border-[#6c47e6] focus:ring-4 focus:ring-[#6c47e6]/10 transition-all text-sm text-gray-700 bg-white w-full sm:w-64 cursor-pointer truncate"
                value={alunoSelecionado?.id || ''}
                onChange={handleSelectChange}
              >
                {estudantes.length === 0 && <option value="">Nenhum aluno cadastrado</option>}
                {estudantes.map(estudante => (
                  <option key={estudante.id} value={estudante.id}>
                    {estudante.nome}
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={handleExportPDF}
              disabled={isExporting || estudantes.length === 0 || loadingNotas}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#6c47e6] hover:bg-[#5533c7] active:bg-[#4a2bb0] text-white px-5 py-2.5 h-11 rounded-xl font-medium text-sm shadow-sm transition-colors disabled:opacity-60 whitespace-nowrap shrink-0"
            >
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {isExporting ? 'Gerando...' : 'Baixar boletim'}
            </button>
          </div>
        </div>

        {/* Painel resumo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 flex items-start gap-4 hover:border-gray-300 hover:shadow-md transition-all duration-200">
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-500">Média da turma</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">8.4</h3>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 flex items-start gap-4 hover:border-gray-300 hover:shadow-md transition-all duration-200">
            <div className="w-11 h-11 rounded-xl bg-[#f3efff] text-[#6c47e6] flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-500">Meus alunos</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{estudantes.length}</h3>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 flex items-start gap-4 hover:border-gray-300 hover:shadow-md transition-all duration-200 sm:col-span-2 md:col-span-1">
            <div className="w-11 h-11 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-500">Tarefas pendentes (aluno atual)</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{pendencias}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* BOLETIM A4 INVISÍVEL PARA PDF                             */}
      {/* ========================================================= */}
      {alunoSelecionado && (
        <div className="absolute left-[-9999px] top-0">
          <div ref={boletimRef} className="w-[794px] min-h-[1123px] bg-white p-12 text-slate-900 font-sans">
            
            <div className="border-b-2 border-[#6c47e6] pb-6 mb-8 flex justify-between items-end">
              <div className="flex flex-col gap-3">
                {/* Logo Adicionada no PDF */}
                <img 
                  src="/img/logo_azul.png" 
                  alt="Escola Discover" 
                  className="h-10 w-auto object-contain"
                />
                <div>
                  <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Relatório Individual</h1>
                  <p className="text-slate-500 mt-1 text-lg">Ano Letivo {alunoSelecionado.ano}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-500">Data de Emissão</p>
                <p className="font-bold text-[#6c47e6]">{new Date().toLocaleDateString('pt-BR')}</p>
              </div>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 mb-8 flex items-center gap-6">
              <div className="h-16 w-16 bg-[#eeeaff] text-[#6c47e6] rounded-full flex items-center justify-center flex-shrink-0">
                <User className="h-8 w-8" />
              </div>
              <div className="grid grid-cols-2 gap-x-12 gap-y-2 flex-1">
                <div><p className="text-sm text-slate-500">Nome do Aluno</p><p className="font-bold text-lg">{alunoSelecionado.nome}</p></div>
                <div><p className="text-sm text-slate-500">Curso</p><p className="font-semibold">{alunoSelecionado.curso}</p></div>
                <div><p className="text-sm text-slate-500">Turma</p><p className="font-semibold">{alunoSelecionado.turma}</p></div>
                <div><p className="text-sm text-slate-500">Status</p><p className="font-semibold text-green-600">Ativo</p></div>
              </div>
            </div>

            <div className="mb-10">
              <h2 className="text-xl font-bold text-slate-800 mb-4 border-l-4 border-[#6c47e6] pl-3">Desempenho por Módulo</h2>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#eeeaff] text-[#5533c7]">
                      <th className="p-4 font-semibold border-b border-slate-200">Atividade / Módulo</th>
                      <th className="p-4 font-semibold border-b border-slate-200 text-center">Nota</th>
                      <th className="p-4 font-semibold border-b border-slate-200 text-center">Situação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {/* Tabela Dinâmica Baseada no Banco de Dados */}
                    {loadingNotas ? (
                      <tr>
                        <td colSpan={3} className="p-8 text-center text-slate-500">
                          Carregando notas do aluno...
                        </td>
                      </tr>
                    ) : notasAluno.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="p-8 text-center text-slate-500">
                          Nenhuma atividade registrada para este aluno.
                        </td>
                      </tr>
                    ) : (
                      notasAluno.map((item, index) => (
                        <tr key={index}>
                          <td className="p-4 font-medium text-slate-700">{item.titulo}</td>
                          <td className="p-4 text-center font-bold">{item.nota !== null ? item.nota : '-'}</td>
                          <td className="p-4 text-center">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              item.status === 'Entregue' ? 'bg-green-100 text-green-700' :
                              item.status === 'Atrasado' ? 'bg-red-100 text-red-700' :
                              'bg-amber-100 text-amber-700'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-24 pt-8 border-t border-slate-200 flex justify-center">
              <div className="text-center">
                <div className="w-64 border-b border-slate-400 mb-2 mx-auto"></div>
                <p className="font-bold text-slate-800">Assinatura da Coordenação</p>
                <p className="text-sm text-slate-500">Escola Discover</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}