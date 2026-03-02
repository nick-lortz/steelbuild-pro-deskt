import { Outlet, Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { Buildings, Robot, ChartBar, Wrench, CurrencyDollar, ClipboardText } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { PMAPanel } from '@/components/pma/pma-panel'

export function MainLayout() {
  const [pmaOpen, setPmaOpen] = useState(false)
  const location = useLocation()

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/')

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-3">
              <Buildings size={32} weight="duotone" className="text-primary" />
              <div>
                <h1 className="text-xl font-bold leading-none">SteelBuild Pro</h1>
                <p className="text-xs text-muted-foreground">Construction Management</p>
              </div>
            </Link>
            
            <nav className="hidden md:flex items-center gap-1">
              <Link to="/">
                <Button
                  variant={isActive('/') && location.pathname === '/' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="gap-2"
                >
                  <ChartBar size={18} />
                  Dashboard
                </Button>
              </Link>
              <Link to="/projects">
                <Button
                  variant={isActive('/projects') ? 'secondary' : 'ghost'}
                  size="sm"
                  className="gap-2"
                >
                  <Buildings size={18} />
                  Projects
                </Button>
              </Link>
              <Link to="/portfolio">
                <Button
                  variant={isActive('/portfolio') ? 'secondary' : 'ghost'}
                  size="sm"
                  className="gap-2"
                >
                  <ChartBar size={18} />
                  Portfolio
                </Button>
              </Link>
              <Link to="/equipment">
                <Button
                  variant={isActive('/equipment') ? 'secondary' : 'ghost'}
                  size="sm"
                  className="gap-2"
                >
                  <Wrench size={18} />
                  Equipment
                </Button>
              </Link>
              <Link to="/cost-codes">
                <Button
                  variant={isActive('/cost-codes') ? 'secondary' : 'ghost'}
                  size="sm"
                  className="gap-2"
                >
                  <CurrencyDollar size={18} />
                  Cost Codes
                </Button>
              </Link>
              <Link to="/audit">
                <Button
                  variant={isActive('/audit') ? 'secondary' : 'ghost'}
                  size="sm"
                  className="gap-2"
                >
                  <ClipboardText size={18} />
                  Audit
                </Button>
              </Link>
            </nav>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPmaOpen(true)}
              className="gap-2"
            >
              <Robot size={18} />
              <span className="hidden sm:inline">PMA</span>
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
