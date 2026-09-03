import { createLazyFileRoute } from '@tanstack/react-router'
import { BarChart3, TrendingUp, Users, BookOpen, Download } from 'lucide-react'

export const Route = createLazyFileRoute('/relatorios' as never)({
  component: RelatoriosPage,
})

function RelatoriosPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Relatórios de Desempenho</h1>
          <p className="text-gray-500 mt-1">Acompanhe as métricas de engajamento e conclusão de atividades.</p>
        </div>
        <button className="flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-5 py-2.5 rounded-xl font-medium shadow-sm transition-all">
          <Download className="w-5 h-5" />
          Exportar PDF
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex items-start gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Taxa de Conclusão</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">--%</h3>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex items-start gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Alunos Ativos (Mês)</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">--</h3>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex items-start gap-4">
          <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Materiais Acessados</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">--</h3>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm flex flex-col items-center justify-center text-center space-y-4 h-96">
        <BarChart3 className="w-16 h-16 text-gray-200" />
        <div>
          <h3 className="text-lg font-semibold text-gray-700">Gráficos em Construção</h3>
          <p className="text-gray-400 text-sm max-w-sm mt-2 mx-auto">
            Em breve, os dados reais das suas turmas alimentarão os gráficos interativos de acesso e engajamento aqui.
          </p>
        </div>
      </div>
    </div>
  )
}