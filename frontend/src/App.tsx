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
        {/* Main content shrinks when copilot is open */}
        <div className="flex-1 overflow-hidden min-w-0">
          <main className="h-full overflow-auto">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard onOpenCopilot={(pid) => { setCopilotProjectId(pid); setCopilotOpen(true) }} />} />
              <Route path="/projects/:projectId" element={<ProjectWorkspace onOpenCopilot={(pid) => { setCopilotProjectId(pid); setCopilotOpen(true) }} />} />
              <Route path="/projects/:projectId/intelligence" element={<IntelligenceCenter />} />
            </Routes>
          </main>
        </div>
        {/* Copilot panel slides in as a sibling — main content shrinks */}
        <div
          className={`flex-shrink-0 overflow-hidden transition-all duration-300 ease-in-out border-l border-slate-200 bg-white ${
            copilotOpen ? 'w-96' : 'w-0'
          }`}
        >
          {copilotOpen && (
            <div className="w-96 h-full">
              <CopilotPanel
                projectId={copilotProjectId}
                onClose={() => setCopilotOpen(false)}
              />
            </div>
          )}
        </div>
      </div>
    </BrowserRouter>
  )
}
