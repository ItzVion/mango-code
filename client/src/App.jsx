import { Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import Dashboard from './pages/Dashboard'
import Course from './pages/Course'
import Lesson from './pages/Lesson'
import Auth from './pages/Auth'
import History from './pages/History'
import Admin from './pages/Admin'
import Donate from './pages/Donate'
import { AboutPage, PrivacyPage, TermsPage, RefundPage, ThirdPartyNoticePage } from './pages/LegalPages'

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/course/:id" element={<Course />} />
        <Route path="/lesson/:id" element={<Lesson />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/results" element={<History />} />
        <Route path="/donations" element={<Donate />} />
        <Route path="/donate" element={<Navigate to="/donations" replace />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/refund" element={<RefundPage />} />
        <Route path="/third-party-notice" element={<ThirdPartyNoticePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  )
}
