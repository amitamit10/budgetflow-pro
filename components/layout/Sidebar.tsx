'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  LayoutDashboard,
  Wallet,
  BarChart2,
  Bot,
  FileSpreadsheet,
  LogOut,
  Moon,
  Sun,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/budget', label: 'Budget', icon: Wallet },
  { href: '/analytics', label: 'Analytics', icon: BarChart2 },
  { href: '/ai', label: 'AI Assistant', icon: Bot },
  { href: '/excel', label: 'Excel Center', icon: FileSpreadsheet },
]

interface SidebarProps {
  userName?: string | null
  userEmail?: string | null
  userImage?: string | null
}

export function Sidebar({ userName, userEmail, userImage }: SidebarProps) {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()

  return (
    <aside className="flex flex-col w-56 shrink-0 border-r border-border bg-background h-screen sticky top-0">
      {/* Logo */}
      <div className="px-4 py-5">
        <span className="text-base font-semibold tracking-tight">BudgetFlow</span>
        <span className="text-base font-semibold text-indigo-600"> Pro</span>
      </div>

      <Separator />

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors',
                active
                  ? 'bg-indigo-50 text-indigo-700 font-medium dark:bg-indigo-950 dark:text-indigo-300'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      <Separator />

      {/* Footer */}
      <div className="px-3 py-3 space-y-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-muted-foreground"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </Button>

        {/* User */}
        <div className="flex items-center gap-2 px-1">
          {userImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={userImage} alt={userName ?? ''} className="h-7 w-7 rounded-full" />
          ) : (
            <div className="h-7 w-7 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-medium text-indigo-700">
              {userName?.[0]?.toUpperCase() ?? '?'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{userName ?? 'User'}</p>
            <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground shrink-0"
            onClick={() => signOut({ callbackUrl: '/login' })}
          >
            <LogOut className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </aside>
  )
}
