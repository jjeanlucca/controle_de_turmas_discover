import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/turmas')({
  component: Turmas,
})

function Turmas() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Gestão de Turmas</h1>
      <p>Aqui ficará o controle acadêmico.</p>
    </div>
  )
}