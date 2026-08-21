import { Outlet } from '@tanstack/react-router'
import React from 'react'

export function AppShell({ children }: { children?: React.ReactNode }) {
  return (
    <div className="flex h-screen w-full bg-gray-50">
      <main className="flex flex-col flex-1 min-w-0 overflow-y-auto">
        {children || <Outlet />}
      </main>
    </div>
  )
}