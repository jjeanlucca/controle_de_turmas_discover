import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css' // 
import { RouterProvider, createRouter } from '@tanstack/react-router'
// If routeTree.gen is generated at build time, TypeScript may complain when it's
// not present in the source tree. Provide an ambient module declaration so the
// compiler won't error while still importing the generated file at runtime.
declare module './routeTree.gen' {
  export const routeTree: any
}
import { routeTree } from './routeTree.gen'

const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const rootElement = document.getElementById('root')!
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <React.StrictMode>
      <RouterProvider router={router} />
    </React.StrictMode>,
  )
}