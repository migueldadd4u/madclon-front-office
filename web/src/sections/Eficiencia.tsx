import type { SerieData, TokensData } from '@/types'
import { colorEstado, fmt } from '@/lib/data'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const GRUPOS = [
  { clave: 'eficiencia' as const, titulo: '⚙️ Eficiencia', sub: 'lo que cuesta el trabajo' },
  { clave: 'eficacia' as const, titulo: '🎯 Eficacia', sub: 'el trabajo que sale' },
  { clave: 'honestidad' as const, titulo: '🔍 Honestidad', sub: 'fiabilidad de la propia medida' },
]

export function Eficiencia({ tokens, serie }: { tokens: TokensData; serie: SerieData }) {
  const puntos = serie.serie.map((p) => ({
    fecha: p.fecha.slice(5),
    indice: p.kpis?.tokens_motor_por_tarea ?? null,
    cache: p.kpis?.pct_cache ?? null,
    fallos: p.kpis?.pct_tokens_en_fallo ?? null,
  }))

  return (
    <section id="eficiencia" className="border-t border-border/60">
      <div className="mx-auto max-w-6xl px-4 py-20">
        <h2 className="text-3xl font-bold tracking-tight">¿Está mejorando el clon?</h2>
        <p className="mt-3 text-muted-foreground max-w-3xl leading-relaxed">
          Desde el {tokens.linea_base_fecha ?? '—'} hay una <strong className="text-foreground">línea base congelada</strong>:
          la foto del «antes». Cada indicador compara contra ella en su propia dirección — en unas cosas mejorar
          es subir (tareas hechas) y en otras es bajar (tokens por tarea).
          {tokens.soporte && <span className="block mt-2 text-xs font-num">soporte de la lectura: {tokens.soporte}</span>}
        </p>

        {GRUPOS.map((g) => (
          <div key={g.clave} className="mt-10">
            <h3 className="font-semibold text-lg">{g.titulo} <span className="text-sm font-normal text-muted-foreground">· {g.sub}</span></h3>
            <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {tokens.kpis[g.clave].map((k) => {
                const c = colorEstado(k.estado)
                return (
                  <div key={k.nombre} className="rounded-xl border border-border bg-card p-4" title={k.significado}>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium leading-tight">{k.nombre}</p>
                      <span className={`size-2 rounded-full shrink-0 ${c.dot}`} title={k.estado} />
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="font-num text-2xl font-bold">{k.ahora}</span>
                      <span className={`text-xs font-num ${c.text}`}>{k.variacion}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 font-num">base: {k.base}</p>
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed line-clamp-3">{k.significado}</p>
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        <div className="mt-10 grid lg:grid-cols-2 gap-6">
          {/* Serie temporal */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="font-semibold">El índice, día a día</h3>
            <p className="text-xs text-muted-foreground mt-0.5 mb-4">
              tokens del motor por tarea hecha — si baja, el clon hace lo mismo gastando menos
            </p>
            {puntos.length >= 2 ? (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={puntos} margin={{ left: 0, right: 8 }}>
                    <XAxis dataKey="fecha" tick={{ fill: 'hsl(215 14% 58%)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis hide domain={['dataMin', 'dataMax']} />
                    <Tooltip
                      contentStyle={{ background: 'hsl(222 20% 8%)', border: '1px solid hsl(220 13% 16%)', borderRadius: 8 }}
                      labelStyle={{ color: 'hsl(210 20% 92%)' }}
                      formatter={(v: number) => [fmt(v), 'tokens/tarea']}
                    />
                    <Area type="monotone" dataKey="indice" stroke="#34d399" fill="#34d39922" strokeWidth={2} isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-56 grid place-items-center rounded-lg bg-secondary/40 text-center p-6">
                <p className="text-sm text-muted-foreground">
                  La serie diaria acaba de nacer ({puntos.length} punto{puntos.length === 1 ? '' : 's'}).
                  <br />Cada día a las 03:00 se añade un punto — vuelve en una semana y verás la curva.
                </p>
              </div>
            )}
          </div>

          {/* Intervenciones */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-6 pt-6 pb-4">
              <h3 className="font-semibold">Intervenciones: ¿sirvió lo que cambiamos?</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                cada mejora aplicada se anota y se juzga sola comparando su KPI antes y después
              </p>
            </div>
            <ul className="divide-y divide-border/60">
              {tokens.intervenciones.length === 0 && (
                <li className="px-6 py-4 text-sm text-muted-foreground">todavía no hay intervenciones registradas</li>
              )}
              {tokens.intervenciones.map((i, idx) => (
                <li key={idx} className="px-6 py-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground font-num">
                    <span>{i.estado}</span>
                    <span>{i.fecha}</span>
                  </div>
                  <p className="text-sm mt-1">{i.cambio}</p>
                  <p className="text-xs text-muted-foreground mt-1">{i.efecto}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
