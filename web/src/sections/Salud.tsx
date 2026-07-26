import type { ClonesData, Overview } from '@/types'
import { colorEstado } from '@/lib/data'
import { CheckCircle2, XCircle, Radio } from 'lucide-react'

export function Salud({ overview, clones }: { overview: Overview; clones: ClonesData }) {
  return (
    <section id="salud" className="border-t border-border/60">
      <div className="mx-auto max-w-6xl px-4 py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Salud del sistema</h2>
            <p className="mt-3 text-muted-foreground max-w-2xl">
              Un guardián automático comprueba cada hora que el clon puede leer el correo y las agendas.
              Si algo falla, el panel lo grita antes de que se note.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card px-5 py-3 text-sm">
            <span className="text-muted-foreground">estado global: </span>
            <span className="font-medium">{overview.salud_global ?? '—'}</span>
          </div>
        </div>

        <div className="mt-10 grid lg:grid-cols-2 gap-6">
          {/* Integraciones */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h3 className="font-semibold">Accesos vigilados</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                correos y agendas que el clon necesita para trabajar
              </p>
            </div>
            <ul className="divide-y divide-border/60">
              {clones.integraciones.map((i) => {
                const c = colorEstado(i.estado)
                return (
                  <li key={i.nombre} className="px-5 py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`size-2 rounded-full shrink-0 ${c.dot}`} />
                      <span className="text-sm truncate">{i.nombre}</span>
                    </div>
                    <span className={`text-xs shrink-0 ${c.text}`}>{i.detalle}</span>
                  </li>
                )
              })}
            </ul>
            <div className="px-5 py-3 border-t border-border text-xs text-muted-foreground font-num">
              último chequeo: {overview.watchdog_ts ? new Date(overview.watchdog_ts).toLocaleString('es-ES') : '—'}
            </div>
          </div>

          <div className="flex flex-col gap-6">
            {/* Gateways */}
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="font-semibold flex items-center gap-2">
                <Radio className="size-4 text-emerald-400" /> Puertas de entrada vivas
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5 mb-4">
                los procesos por los que Miguel habla con su clon
              </p>
              <div className="flex flex-wrap gap-2">
                {(overview.gateways ?? []).map((g) => (
                  <span key={g} className="font-num text-xs rounded-md bg-secondary px-2.5 py-1.5 border border-border/60">
                    {g}
                  </span>
                ))}
              </div>
              {overview.healthcheck && (
                <p className="mt-4 text-xs text-muted-foreground">
                  motor <span className="font-num">{overview.healthcheck.head}</span>
                  {' · '}
                  {overview.healthcheck.problemas === 0 ? (
                    <span className="text-emerald-400">sin problemas</span>
                  ) : (
                    <span className="text-amber-400">{overview.healthcheck.problemas} aviso(s)</span>
                  )}
                </p>
              )}
            </div>

            {/* Crons */}
            <div className="rounded-xl border border-border bg-card overflow-hidden flex-1">
              <div className="px-5 py-4 border-b border-border">
                <h3 className="font-semibold">Rutinas automáticas</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  lo que el sistema hace solo cada día o cada semana
                </p>
              </div>
              <ul className="divide-y divide-border/60">
                {overview.crons.map((c) => (
                  <li key={c.nombre} className="px-5 py-2.5 flex items-center justify-between gap-3 text-sm">
                    <span className="flex items-center gap-2 min-w-0">
                      {c.estado === 'ok' ? (
                        <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="size-4 text-red-400 shrink-0" />
                      )}
                      <span className="truncate">{c.nombre}</span>
                    </span>
                    <span className="font-num text-xs text-muted-foreground shrink-0">{c.ultima}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
