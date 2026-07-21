import { createLazyFileRoute } from '@tanstack/react-router'

// @ts-ignore - Bypass temporário para o gerador de rotas rodar
export const Route = createLazyFileRoute('/')({
  component: Dashboard,
})

function Dashboard() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-emerald-800">Dashboard Discover</h1>
      <p>Bem-vindo ao painel principal.</p>
    </div>
  )
}