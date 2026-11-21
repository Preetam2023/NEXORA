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
        <div className="flex-1 flex overflow-hidden min-w-0">
          <main className="flex-1 overflow-auto">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard onOpenCopilot={(pid) => { setCopilotProjectId(pid); setCopilotOpen(true) }} />} />
              <Route path="/projects/:projectId" element={<ProjectWorkspace onOpenCopilot={(pid) => { setCopilotProjectId(pid); setCopilotOpen(true) }} />} />
              <Route path="/projects/:projectId/intelligence" element={<IntelligenceCenter />} />
            </Routes>
          </main>
          {copilotOpen && (
            <CopilotPanel
              projectId={copilotProjectId}
              onClose={() => setCopilotOpen(false)}
            />
          )}
        </div>
      </div>
    </BrowserRouter>
  )
}
