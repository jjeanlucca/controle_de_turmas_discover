import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

// Crie a instância do roteador
const router = createRouter({ routeTree })

// Registre o roteador para ter tipagem 100% segura em todo o projeto
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

// Renderize o app dentro da div "root" do index.html
const rootElement = document.getElementById('root')!
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <React.StrictMode>
      <RouterProvider router={router} />
    </React.StrictMode>,
  )
}