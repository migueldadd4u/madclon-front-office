import type { Overview } from '@/types'
import { Activity } from 'lucide-react'

const enlaces = [
  { href: '#que-es', label: 'Qué es' },
  { href: '#flota', label: 'La flota' },
  { href: '#salud', label: 'Salud' },
  { href: '#tokens', label: 'Tokens' },
  { href: '#eficiencia', label: 'Eficiencia' },
  { href: '#actividad', label: 'Actividad' },
]

export function Nav({ overview }: { overview: Overview }) {
  const ok = (overview.salud_global ?? '').includes('🟢')
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between gap-4">
        <a href="#" className="flex items-center gap-2 font-semibold tracking-tight">
          <Activity className="size-4 text-emerald-400" />
          MAD CLON <span className="text-muted-foreground font-normal hidden sm:inline">· front office</span>
        </a>
        <nav className="hidden md:flex items-center gap-5 text-sm text-muted-foreground">
          {enlaces.map((e) => (
            <a key={e.href} href={e.href} className="hover:text-foreground transition-colors">
              {e.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2 text-xs">
          <span className={`size-2 rounded-full ${ok ? 'bg-emerald-400' : 'bg-amber-400'} animate-pulse`} />
          <span className="text-muted-foreground hidden sm:inline">{ok ? 'sistema operativo' : 'revisar sistema'}</span>
        </div>
      </div>
    </header>
  )
}
