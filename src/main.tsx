import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router'

import { Toaster } from '@/components/toast'
import { TooltipProvider } from '@/components/ui/tooltip'
import { router } from '@/app/router'
import { createQueryClient } from '@/lib/query'

import './index.css'

const queryClient = createQueryClient()

// Permissions are provided by <AuthProvider> (from GET /api/me) around the
// authenticated route tree; guest screens and /ui-kit run without a session.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <RouterProvider router={router} />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  </StrictMode>,
)
