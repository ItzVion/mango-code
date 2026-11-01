import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const Course = lazy(() => import('./pages/Course'))
const Lesson = lazy(() => import('./pages/Lesson'))
const Auth = lazy(() => import('./pages/Auth'))
const History = lazy(() => import('./pages/History'))
const Admin = lazy(() => import('./pages/Admin'))
const Donate = lazy(() => import('./pages/Donate'))
const AboutPage = lazy(() => import('./pages/LegalPages').then(module => ({ default: module.AboutPage })))
const PrivacyPage = lazy(() => import('./pages/LegalPages').then(module => ({ default: module.PrivacyPage })))
const TermsPage = lazy(() => import('./pages/LegalPages').then(module => ({ default: module.TermsPage })))
const RefundPage = lazy(() => import('./pages/LegalPages').then(module => ({ default: module.RefundPage })))
const ThirdPartyNoticePage = lazy(() => import('./pages/LegalPages').then(module => ({ default: module.ThirdPartyNoticePage })))

export default function App() {
  return (
    <AppShell>
      <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-12 text-sm text-ink-soft" role="status">Loading page…</div>}>
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
      </Suspense>
    </AppShell>
  )
}
