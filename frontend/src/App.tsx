import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import Dashboard from '@/pages/Dashboard'
import ProjectWorkspace from '@/pages/ProjectWorkspace'
import IntelligenceCenter from '@/pages/IntelligenceCenter'
import CopilotPanel from '@/components/CopilotPanel'

export default function App() {
  const [copilotOpen, setCopilotOpen] = useState(false)
  const [copilotProjectId, setCopilotProjectId] = useState<string | undefined>()

  return (
    <BrowserRouter>
      <div className="flex h-screen bg-slate-50 overflow-hidden">
        <Sidebar
          onOpenCopilot={(pid) => { setCopilotProjectId(pid); setCopilotOpen(true) }}
        />
        <div className="flex-1 overflow-hidden relative">
          <main className="h-full overflow-auto">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard onOpenCopilot={(pid) => { setCopilotProjectId(pid); setCopilotOpen(true) }} />} />
              <Route path="/projects/:projectId" element={<ProjectWorkspace onOpenCopilot={(pid) => { setCopilotProjectId(pid); setCopilotOpen(true) }} />} />
              <Route path="/projects/:projectId/intelligence" element={<IntelligenceCenter />} />
            </Routes>
          </main>
          {/* Copilot slides over content from the right — no layout shift */}
          <div className={`absolute inset-y-0 right-0 w-96 z-20 shadow-2xl transition-transform duration-300 ease-in-out ${copilotOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            {copilotOpen && (
              <CopilotPanel
                projectId={copilotProjectId}
                onClose={() => setCopilotOpen(false)}
              />
            )}
          </div>
          {copilotOpen && (
            <div
              className="absolute inset-0 z-10 bg-black/20 backdrop-blur-[1px]"
              onClick={() => setCopilotOpen(false)}
            />
          )}
        </div>
      </div>
    </BrowserRouter>
  )
}
