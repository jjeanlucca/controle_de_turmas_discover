import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/' as any)({
  component: IndexPage, // ou o nome do seu componente atual
})

function IndexPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-800">Dashboard Principal</h1>
      <p className="text-gray-600 mt-2">Visão geral do controle de turmas da Escola Discover.</p>
    </div>
  )
}