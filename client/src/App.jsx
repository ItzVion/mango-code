import { Routes, Route } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import Dashboard from './pages/Dashboard'
import Course from './pages/Course'
import Exercise from './pages/Exercise'

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/course/:id" element={<Course />} />
        <Route path="/exercise/:id" element={<Exercise />} />
      </Routes>
    </AppShell>
  )
}
