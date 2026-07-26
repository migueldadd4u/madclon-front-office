import type { PanelData } from '@/types'
import { fmtCorto, fmt } from '@/lib/data'
import { Bot, CalendarCheck2, HeartPulse, Zap } from 'lucide-react'

export function Hero({ data }: { data: PanelData }) {
  const { overview, tokens, clones, manifest } = data
  const generado = new Date(manifest.generado).toLocaleString('es-ES', {
    day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
  })

  const stats = [
    {
      icon: Zap,
      valor: fmtCorto(tokens.contador.ventana_30d),
      detalle: `${fmt(tokens.contador.ventana_30d)} tokens`,
      label: 'trabajo de IA en 30 días',
    },
    {
      icon: Bot,
      valor: String(clones.clones.length),
      detalle: '+ el motor de automejora',
      label: 'clones con oficio propio',
    },
    {
      icon: HeartPulse,
      valor: `${overview.gateways?.length ?? '—'}`,
      detalle: 'canales de comunicación',
      label: 'gateways vivos',
    },
    {
      icon: CalendarCheck2,
      valor: `${overview.crons.length - overview.crons_en_error}/${overview.crons.length}`,
      detalle: 'rutinas automáticas al día',
      label: 'crons en verde',
    },
  ]

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 hero-grid" aria-hidden />
      <div className="relative mx-auto max-w-6xl px-4 pt-20 pb-16 sm:pt-28">
        <p className="text-emerald-400 text-sm font-medium mb-4 tracking-wide uppercase">
          La sala de control, abierta
        </p>
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight max-w-3xl">
          Un equipo de inteligencia artificial que trabaja{' '}
          <span className="text-emerald-400">mientras Miguel vive su vida</span>
        </h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-2xl leading-relaxed">
          Esto es el <strong className="text-foreground">Clon de MAD</strong>: un sistema que lee el correo,
          clasifica lo importante, prepara decisiones, vigila el patrimonio y se mejora a sí mismo cada noche.
          Esta página es su cuadro de mandos — los mismos números que ve él, explicados para personas.
        </p>

        <div className="mt-12 grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-card/70 backdrop-blur p-5">
              <s.icon className="size-5 text-emerald-400 mb-3" />
              <div className="font-num text-3xl font-bold" title={s.detalle}>{s.valor}</div>
              <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        <p className="mt-8 text-xs text-muted-foreground font-num">
          datos generados el {generado} · solo cifras agregadas, sin información personal
        </p>
      </div>
    </section>
  )
}
