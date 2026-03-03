import { Outlet, Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { Buildings, Robot, ChartBar, Package, Pencil, Factory, Truck, Crane, Gear, BellSimple, User } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { PMAPanel } from '@/components/pma/pma-panel'
import { OfflineIndicator } from '@/components/shared/offline-indicator'
import { PageTransition } from '@/components/shared/page-transition'

export function MainLayout() {
  const [pmaOpen, setPmaOpen] = useState(false)
  const location = useLocation()

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/')

  const tabs = [
    { path: '/', label: 'Dashboard', icon: ChartBar, exact: true },
    { path: '/projects', label: 'Projects', icon: Buildings },
    { path: '/portfolio', label: 'Portfolio', icon: ChartBar },
  ]

  return (
    <div className="min-h-screen bg-page-bg flex items-start justify-center p-4 md:p-6 lg:p-8">
      <div className="w-full max-w-[1800px] phoenix-frame overflow-hidden">
        <header className="border-b border-panel-border bg-panel-bg/50 backdrop-blur-sm">
          <div className="flex h-20 items-center justify-between px-8">
            <div className="flex items-center gap-12">
              <Link to="/" className="flex items-center gap-3 group">
                <div className="relative">
                  <Buildings size={32} weight="duotone" className="text-accent transition-all duration-300 group-hover:scale-110" style={{ filter: 'drop-shadow(0 0 12px rgba(255, 90, 31, 0.4))' }} />
                </div>
                <div>
                  <h1 className="font-display text-lg font-bold leading-none tracking-tight text-text uppercase">
                    STEELBUILD PRO
                  </h1>
                  <p className="text-[10px] text-text-mute font-medium tracking-wider uppercase mt-0.5">Phoenix Industrial Control</p>
                </div>
              </Link>
              
              <nav className="hidden lg:flex items-center gap-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  const active = tab.exact 
                    ? location.pathname === tab.path 
                    : isActive(tab.path)
                  
                  return (
                    <Link key={tab.path} to={tab.path}>
                      <button
                        className={`
                          px-5 py-2.5 rounded-xl font-medium text-sm uppercase tracking-wide transition-all duration-200
                          flex items-center gap-2
                          ${active 
                            ? 'bg-accent text-white phoenix-glow shadow-lg' 
                            : 'text-text-dim hover:text-text hover:bg-panel-bg-2'
                          }
                        `}
                      >
                        <Icon size={16} weight={active ? 'fill' : 'regular'} />
                        {tab.label}
                      </button>
                    </Link>
                  )
                })}
              </nav>
            </div>
            
            <div className="flex items-center gap-3">
              <OfflineIndicator />
              <button className="w-10 h-10 rounded-full flex items-center justify-center text-text-dim hover:text-text hover:bg-panel-bg-2 transition-all duration-200">
                <BellSimple size={20} weight="regular" />
              </button>
              <button className="w-10 h-10 rounded-full flex items-center justify-center text-text-dim hover:text-text hover:bg-panel-bg-2 transition-all duration-200">
                <User size={20} weight="regular" />
              </button>
            </div>
          </div>
        </header>

        <main className="p-8 min-h-[calc(100vh-12rem)]">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </main>
      </div>

      <PMAPanel open={pmaOpen} onOpenChange={setPmaOpen} />
    </div>
  )
}
