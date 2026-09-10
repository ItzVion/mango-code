import { Routes, Route } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import Dashboard from './pages/Dashboard'
import Course from './pages/Course'
import Lesson from './pages/Lesson'

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/course/:id" element={<Course />} />
        <Route path="/lesson/:id" element={<Lesson />} />
      </Routes>
    </AppShell>
  )
}
