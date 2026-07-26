import type { Overview } from '@/types'
import { fmt } from '@/lib/data'
import { Inbox, ListChecks, Hourglass, Vote, Users, Cog } from 'lucide-react'

export function Actividad({ overview }: { overview: Overview }) {
  const { gtd, automejora, personas } = overview
  const colaTotal = automejora.hechas + automejora.bloqueadas + automejora.aparcadas + automejora.pendientes

  const contadores = [
    { icon: Vote, valor: gtd.propuestas, label: 'propuestas del clon esperando el sí o el no de Miguel', aviso: (gtd.propuestas ?? 0) > 50 },
    { icon: Inbox, valor: gtd.bandeja, label: 'capturas en la bandeja sin clasificar', aviso: false },
    { icon: Hourglass, valor: gtd.esperas_vencidas, label: 'cosas que otros debían haber contestado ya', aviso: (gtd.esperas_vencidas ?? 0) > 0 },
    { icon: ListChecks, valor: gtd.decisiones, label: 'decisiones abiertas sobre el propio sistema', aviso: false },
  ]

  return (
    <section id="actividad" className="border-t border-border/60">
      <div className="mx-auto max-w-6xl px-4 py-20">
        <h2 className="text-3xl font-bold tracking-tight">¿Qué espera de Miguel ahora mismo?</h2>
        <p className="mt-3 text-muted-foreground max-w-2xl">
          El clon prepara; el humano decide. Esto es lo que hay encima de la mesa — solo cantidades,
          el contenido vive a salvo en el vault privado.
        </p>

        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {contadores.map((c) => (
            <div key={c.label} className={`rounded-xl border p-6 ${c.aviso ? 'border-amber-400/40 bg-amber-400/5' : 'border-border bg-card'}`}>
              <c.icon className={`size-5 mb-3 ${c.aviso ? 'text-amber-400' : 'text-emerald-400'}`} />
              <p className="font-num text-4xl font-bold">{fmt(c.valor)}</p>
              <p className="text-sm text-muted-foreground mt-2 leading-snug">{c.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 grid lg:grid-cols-2 gap-6">
          {/* Automejora */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="font-semibold flex items-center gap-2">
              <Cog className="size-4 text-emerald-400" /> El motor que se mejora solo · 7 días
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5 mb-5">
              cada noche el sistema se autoaudita y propone mejoras; coste en factura variable: {automejora.metered} tokens
            </p>
            {[
              { label: 'mejoras completadas', valor: automejora.hechas, color: 'bg-emerald-400' },
              { label: 'pendientes', valor: automejora.pendientes, color: 'bg-sky-400' },
              { label: 'aparcadas', valor: automejora.aparcadas, color: 'bg-zinc-500' },
              { label: 'bloqueadas', valor: automejora.bloqueadas, color: 'bg-red-400' },
            ].map((f) => (
              <div key={f.label} className="mb-3">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">{f.label}</span>
                  <span className="font-num">{f.valor}</span>
                </div>
                <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div className={`h-full rounded-full ${f.color}`} style={{ width: `${(f.valor / Math.max(colaTotal, 1)) * 100}%` }} />
                </div>
              </div>
            ))}
            <p className="text-xs text-muted-foreground mt-4">
              {fmt(automejora.llamadas)} llamadas al consejo de modelos · reparto: {automejora.top}
            </p>
          </div>

          {/* Personas */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="font-semibold flex items-center gap-2">
              <Users className="size-4 text-emerald-400" /> La memoria de las personas
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5 mb-5">
              fichas curadas de la red de contactos de Miguel — quien es quién, de qué se habló, qué se debe
            </p>
            <div className="flex items-end gap-8">
              <div>
                <p className="font-num text-5xl font-bold">{fmt(personas.fichas_curadas)}</p>
                <p className="text-sm text-muted-foreground mt-1">fichas curadas</p>
              </div>
              <div>
                <p className="font-num text-3xl font-bold text-amber-400">{fmt(personas.staged)}</p>
                <p className="text-sm text-muted-foreground mt-1">esperando revisión humana</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-6 leading-relaxed">
              Cada ficha pasa por un control de calidad: la IA propone, pero fusionar o dar por buena
              una identidad exige evidencia. Nadie entra en la memoria por la puerta de atrás.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
