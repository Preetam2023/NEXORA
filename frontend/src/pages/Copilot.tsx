import { Navigate } from 'react-router-dom'

// Copilot is now a global panel — open it via the sidebar AI Copilot button
export default function Copilot() {
  return <Navigate to="/dashboard" replace />
}
