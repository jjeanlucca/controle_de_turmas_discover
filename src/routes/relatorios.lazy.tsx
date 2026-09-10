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

function RelatoriosPage() {
  const boletimRef = useRef<HTMLDivElement>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [estudantes, setEstudantes] = useState<Estudante[]>([])
  const [alunoSelecionado, setAlunoSelecionado] = useState<Estudante | null>(null)
  const [loadingDados, setLoadingDados] = useState(true)

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
              disabled={isExporting || estudantes.length === 0}
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
              <p className="text-xs sm:text-sm text-gray-500">Tarefas pendentes</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">3</h3>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* BOLETIM A4 INVISÍVEL PARA PDF                             */}
      {/* Mantido com identidade de documento formal, separada do   */}
      {/* chrome do app, para não afetar a captura via html-to-image */}
      {/* ========================================================= */}
      {alunoSelecionado && (
        <div className="absolute left-[-9999px] top-0">
          <div ref={boletimRef} className="w-[794px] min-h-[1123px] bg-white p-12 text-slate-900 font-sans">
            
            <div className="border-b-2 border-[#6c47e6] pb-6 mb-8 flex justify-between items-end">
              <div>
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Relatório Individual</h1>
                <p className="text-slate-500 mt-1 text-lg">Escola Discover - Ano Letivo {alunoSelecionado.ano}</p>
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
                      <th className="p-4 font-semibold border-b border-slate-200">Módulo de Estudo</th>
                      <th className="p-4 font-semibold border-b border-slate-200 text-center">Nota</th>
                      <th className="p-4 font-semibold border-b border-slate-200 text-center">Situação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {/* Linhas Mockadas - Em breve conectaremos à tabela avaliacoes */}
                    <tr>
                      <td className="p-4 font-medium text-slate-700">Introdução ao HTML5</td>
                      <td className="p-4 text-center font-bold">10.0</td>
                      <td className="p-4 text-center"><span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">Aprovado</span></td>
                    </tr>
                    <tr>
                      <td className="p-4 font-medium text-slate-700">Estilização com CSS3</td>
                      <td className="p-4 text-center font-bold">8.5</td>
                      <td className="p-4 text-center"><span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">Aprovado</span></td>
                    </tr>
                    <tr>
                      <td className="p-4 font-medium text-slate-700">Lógica com JavaScript</td>
                      <td className="p-4 text-center font-bold">-</td>
                      <td className="p-4 text-center"><span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">Em andamento</span></td>
                    </tr>
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