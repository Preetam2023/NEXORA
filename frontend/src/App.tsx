import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import Dashboard from '@/pages/Dashboard'
import ProjectWorkspace from '@/pages/ProjectWorkspace'
import IntelligenceCenter from '@/pages/IntelligenceCenter'
import Copilot from '@/pages/Copilot'

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-auto">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/projects/:projectId" element={<ProjectWorkspace />} />
              <Route path="/projects/:projectId/intelligence" element={<IntelligenceCenter />} />
              <Route path="/projects/:projectId/copilot" element={<Copilot />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  )
}
