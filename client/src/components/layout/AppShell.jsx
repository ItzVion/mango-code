import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

export function AppShell({ children }) {
  return <div className="min-h-screen bg-paper"><Sidebar/><div className="min-h-screen md:pl-64"><Topbar/><main className="px-5 pb-12 md:px-8">{children}</main></div></div>
}
