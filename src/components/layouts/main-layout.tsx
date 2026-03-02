import { Outlet, Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { Buildings, Robot, ChartBar, Wrench, CurrencyDollar, ClipboardText, Gear } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { PMAPanel } from '@/components/pma/pma-panel'
import { OfflineIndicator } from '@/components/shared/offline-indicator'

export function MainLayout() {
  const [pmaOpen, setPmaOpen] = useState(false)
  const location = useLocation()

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/')

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-card/95 backdrop-blur-xl supports-[backdrop-filter]:bg-card/80" style={{ boxShadow: 'var(--shadow-sm)' }}>
        <div className="container flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="relative">
                <Buildings size={36} weight="duotone" className="text-primary transition-all duration-200 group-hover:scale-110 group-hover:text-accent" />
                <div className="absolute inset-0 bg-primary/20 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <div>
                <h1 className="text-xl font-bold leading-none tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">SteelBuild Pro</h1>
                <p className="text-xs text-muted-foreground font-medium tracking-wide">Construction Management</p>
              </div>
            </Link>
            
            <nav className="hidden lg:flex items-center gap-1">
              <Link to="/">
                <Button
                  variant={isActive('/') && location.pathname === '/' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="gap-2 font-medium"
                >
                  <ChartBar size={18} weight={isActive('/') && location.pathname === '/' ? 'fill' : 'regular'} />
                  Dashboard
                </Button>
              </Link>
              <Link to="/projects">
                <Button
                  variant={isActive('/projects') ? 'secondary' : 'ghost'}
                  size="sm"
                  className="gap-2 font-medium"
                >
                  <Buildings size={18} weight={isActive('/projects') ? 'fill' : 'regular'} />
                  Projects
                </Button>
              </Link>
              <Link to="/portfolio">
                <Button
                  variant={isActive('/portfolio') ? 'secondary' : 'ghost'}
                  size="sm"
                  className="gap-2 font-medium"
                >
                  <ChartBar size={18} weight={isActive('/portfolio') ? 'fill' : 'regular'} />
                  Portfolio
                </Button>
              </Link>
              <Link to="/equipment">
                <Button
                  variant={isActive('/equipment') ? 'secondary' : 'ghost'}
                  size="sm"
                  className="gap-2 font-medium"
                >
                  <Wrench size={18} weight={isActive('/equipment') ? 'fill' : 'regular'} />
                  Equipment
                </Button>
              </Link>
              <Link to="/cost-codes">
                <Button
                  variant={isActive('/cost-codes') ? 'secondary' : 'ghost'}
                  size="sm"
                  className="gap-2 font-medium"
                >
                  <CurrencyDollar size={18} weight={isActive('/cost-codes') ? 'fill' : 'regular'} />
                  Cost Codes
                </Button>
              </Link>
              <Link to="/audit">
                <Button
                  variant={isActive('/audit') ? 'secondary' : 'ghost'}
                  size="sm"
                  className="gap-2 font-medium"
                >
                  <ClipboardText size={18} weight={isActive('/audit') ? 'fill' : 'regular'} />
                  Audit
                </Button>
              </Link>
            </nav>
          </div>
          
          <div className="flex items-center gap-2">
            <OfflineIndicator />
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
              className="gap-2 border-primary/20 hover:bg-primary/5 hover:text-primary hover:border-primary/40 transition-all"
            >
              <Robot size={18} weight="duotone" />
              <span className="hidden sm:inline font-medium">PMA</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container px-6 py-8">
        <Outlet />
      </main>

      <PMAPanel open={pmaOpen} onOpenChange={setPmaOpen} />
    </div>
  )
}
