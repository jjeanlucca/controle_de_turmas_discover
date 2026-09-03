/* eslint-disable */
// @ts-nocheck

import { createFileRoute } from '@tanstack/react-router'
import { Route as rootRouteImport } from './routes/__root'

const IndexLazyRouteImport = createFileRoute('/')()
const IndexLazyRoute = IndexLazyRouteImport.update({
  id: '/',
  path: '/',
  getParentRoute: () => rootRouteImport,
} as any).lazy(() => import('./routes/index.lazy').then((d) => d.Route))

const LoginLazyRouteImport = createFileRoute('/login')()
const LoginLazyRoute = LoginLazyRouteImport.update({
  id: '/login',
  path: '/login',
  getParentRoute: () => rootRouteImport,
} as any).lazy(() => import('./routes/login.lazy').then((d) => d.Route))

const AlunosLazyRouteImport = createFileRoute('/alunos')()
const AlunosLazyRoute = AlunosLazyRouteImport.update({
  id: '/alunos',
  path: '/alunos',
  getParentRoute: () => rootRouteImport,
} as any).lazy(() => import('./routes/alunos.lazy').then((d) => d.Route))

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

const TarefasLazyRouteImport = createFileRoute('/tarefas')()
const TarefasLazyRoute = TarefasLazyRouteImport.update({
  id: '/tarefas',
  path: '/tarefas',
  getParentRoute: () => rootRouteImport,
} as any).lazy(() => import('./routes/tarefas.lazy').then((d) => d.Route))

const RelatoriosLazyRouteImport = createFileRoute('/relatorios')()
const RelatoriosLazyRoute = RelatoriosLazyRouteImport.update({
  id: '/relatorios',
  path: '/relatorios',
  getParentRoute: () => rootRouteImport,
} as any).lazy(() => import('./routes/relatorios.lazy').then((d) => d.Route))

const ConfiguracoesLazyRouteImport = createFileRoute('/configuracoes')()
const ConfiguracoesLazyRoute = ConfiguracoesLazyRouteImport.update({
  id: '/configuracoes',
  path: '/configuracoes',
  getParentRoute: () => rootRouteImport,
} as any).lazy(() => import('./routes/configuracoes.lazy').then((d) => d.Route))

const rootRouteChildren = {
  IndexLazyRoute: IndexLazyRoute,
  LoginLazyRoute: LoginLazyRoute,
  AlunosLazyRoute: AlunosLazyRoute,
  TurmasLazyRoute: TurmasLazyRoute,
  BibliotecaLazyRoute: BibliotecaLazyRoute,
  TarefasLazyRoute: TarefasLazyRoute,
  RelatoriosLazyRoute: RelatoriosLazyRoute,
  ConfiguracoesLazyRoute: ConfiguracoesLazyRoute,
}

export const routeTree = rootRouteImport._addFileChildren(rootRouteChildren)