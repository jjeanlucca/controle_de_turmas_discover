import { createLazyFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export const Route = createLazyFileRoute('/turmas')({
  component: Turmas,
})

// Definindo a interface baseada na sua estrutura de banco de dados
interface Turma {
  id: string
  nome: string
  ano_letivo: number
}

function Turmas() {
  const [turmas, setTurmas] = useState<Turma[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchTurmas() {
      // Fazendo a query na tabela 'turmas' que criamos no Supabase
      const { data, error } = await supabase
        .from('turmas')
        .select('*')

      if (error) {
        console.error('Erro ao buscar turmas:', error.message)
      } else {
        setTurmas(data || [])
      }
      
      setLoading(false)
    }

    fetchTurmas()
  }, [])

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Controle de Turmas</h1>
        <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md font-medium transition-colors">
          + Nova Turma
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-32">
          <p className="text-gray-500 animate-pulse">Buscando dados no servidor...</p>
        </div>
      ) : turmas.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center">
          <p className="text-gray-500 mb-4">Nenhuma turma cadastrada ainda.</p>
          <p className="text-sm text-gray-400">Adicione uma turma no Supabase ou clique em Nova Turma.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {turmas.map((turma) => (
            <div key={turma.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <h2 className="text-xl font-semibold text-emerald-800 mb-2">{turma.nome}</h2>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Ano Letivo:</span>
                <span className="font-medium">{turma.ano_letivo}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}