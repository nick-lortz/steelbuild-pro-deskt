import { Outlet, Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { Buildings, Robot, ChartBar, Package, Pencil, Factory, Truck, Crane, Gear } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { PMAPanel } from '@/components/pma/pma-panel'
import { OfflineIndicator } from '@/components/shared/offline-indicator'
import { PageTransition } from '@/components/shared/page-transition'
import { ThemeToggle } from '@/components/shared/theme-toggle'

export function MainLayout() {
  const [pmaOpen, setPmaOpen] = useState(false)
  const location = useLocation()

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/')

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur-xl supports-[backdrop-filter]:bg-card/90 steel-shadow">
        <div className="container flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="relative">
                <Buildings size={36} weight="duotone" className="text-accent transition-all duration-300 group-hover:scale-110 dark:drop-shadow-[0_0_8px_rgba(100,150,255,0.5)]" />
              </div>
              <div>
                <h1 className="font-display text-xl font-bold leading-none tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-transparent">
                  SteelBuild Pro
                </h1>
                <p className="text-xs text-muted-foreground font-medium tracking-wide">Construction Management</p>
              </div>
            </Link>
            
            <nav className="hidden xl:flex items-center gap-1">
              <Link to="/">
                <Button
                  variant={isActive('/') && location.pathname === '/' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="gap-2 font-medium transition-all duration-200"
                >
                  <ChartBar size={18} weight={isActive('/') && location.pathname === '/' ? 'fill' : 'regular'} />
                  Dashboard
                </Button>
              </Link>
              <Link to="/projects">
                <Button
                  variant={isActive('/projects') ? 'secondary' : 'ghost'}
                  size="sm"
                  className="gap-2 font-medium transition-all duration-200"
                >
                  <Buildings size={18} weight={isActive('/projects') ? 'fill' : 'regular'} />
                  Projects
                </Button>
              </Link>
              <Link to="/portfolio">
                <Button
                  variant={isActive('/portfolio') ? 'secondary' : 'ghost'}
                  size="sm"
                  className="gap-2 font-medium transition-all duration-200"
                >
                  <ChartBar size={18} weight={isActive('/portfolio') ? 'fill' : 'regular'} />
                  Portfolio
                </Button>
              </Link>
            </nav>
          </div>
          
          <div className="flex items-center gap-2">
            <OfflineIndicator />
            <ThemeToggle />
            <Link to="/settings">
              <Button
                variant={isActive('/settings') ? 'secondary' : 'ghost'}
                size="sm"
                className="gap-2"
              >
                <Gear size={18} weight={isActive('/settings') ? 'fill' : 'regular'} />
                <span className="hidden sm:inline">Settings</span>
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPmaOpen(true)}
              className="gap-2 border-accent/30 bg-accent/5 hover:bg-accent/10 hover:text-accent hover:border-accent/50 transition-all duration-200 dark:welder-glow"
            >
              <Robot size={18} weight="duotone" />
              <span className="hidden sm:inline font-medium">PMA</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container px-6 py-8">
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>

      <PMAPanel open={pmaOpen} onOpenChange={setPmaOpen} />
    </div>
  )
}
