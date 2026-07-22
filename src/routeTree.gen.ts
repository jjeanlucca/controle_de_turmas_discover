/* eslint-disable */
// @ts-nocheck

import { createFileRoute } from '@tanstack/react-router'
import { Route as rootRouteImport } from './routes/__root'

const TurmasLazyRouteImport = createFileRoute('/turmas')()
const TurmasLazyRoute = TurmasLazyRouteImport.update({
  id: '/turmas',
  path: '/turmas',
  getParentRoute: () => rootRouteImport,
} as any).lazy(() => import('./routes/turmas.lazy').then((d) => d.Route))

const BibliotecaLazyRouteImport = createFileRoute('/biblioteca')()
const BibliotecaLazyRoute = BibliotecaLazyRouteImport.update({
  id: '/biblioteca',
  path: '/biblioteca',
  getParentRoute: () => rootRouteImport,
} as any).lazy(() => import('./routes/biblioteca.lazy').then((d) => d.Route))

const rootRouteChildren = {
  TurmasLazyRoute: TurmasLazyRoute,
  BibliotecaLazyRoute: BibliotecaLazyRoute,
}

export const routeTree = rootRouteImport._addFileChildren(rootRouteChildren)