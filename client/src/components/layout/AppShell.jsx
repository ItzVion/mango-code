import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { AnimationLayer } from '../motion/AnimationLayer'

export function AppShell({ children }) {
  return <div className="min-h-screen bg-paper"><AnimationLayer/><Sidebar/><div className="min-h-screen md:pl-64"><Topbar/><main className="px-5 pb-12 md:px-8">{children}</main></div></div>
}
