import type { TokensData } from '@/types'
import { fmt, fmtCorto } from '@/lib/data'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'

const COLORES_CLON = ['#34d399', '#2dd4bf', '#38bdf8', '#a78bfa', '#fbbf24', '#fb923c', '#f472b6', '#94a3b8', '#64748b']

export function Tokens({ tokens }: { tokens: TokensData }) {
  const c = tokens.contador

  const datosClon = [...tokens.por_clon]
    .sort((a, b) => (b.tokens ?? 0) - (a.tokens ?? 0))
    .map((d) => ({ ...d, nombre: d.clon }))

  return (
    <section id="tokens" className="border-t border-border/60">
      <div className="mx-auto max-w-6xl px-4 py-20">
        <h2 className="text-3xl font-bold tracking-tight">¿Cuánto trabaja y quién lo hace?</h2>
        <p className="mt-3 text-muted-foreground max-w-3xl leading-relaxed">
          La IA se paga por <strong className="text-foreground">tokens</strong>: la unidad con que se mide el texto
          (un token ≈ 3-4 letras; esta página entera son unos 600). Cada cifra dice de dónde viene:
          <strong className="text-foreground"> medida</strong> (la dio el proveedor, exacta) o
          <strong className="text-foreground"> estimada</strong> (calculada, porque ese proveedor no informa).
          Nunca se mezclan.
        </p>

        {/* Contador común */}
        <div className="mt-10 grid sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/5 p-6">
            <p className="text-sm text-emerald-400 font-medium">✅ Medido por el proveedor</p>
            <p className="font-num text-3xl font-bold mt-2">{fmtCorto(c.medido_tokens)}</p>
            <p className="text-xs text-muted-foreground mt-1 font-num">{fmt(c.medido_tokens)} tokens · {fmt(c.medido_llamadas)} llamadas</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-6">
            <p className="text-sm text-muted-foreground font-medium">≈ Estimado (pasado ciego)</p>
            <p className="font-num text-3xl font-bold mt-2">{fmtCorto(c.estimado_tokens)}</p>
            <p className="text-xs text-muted-foreground mt-1 font-num">
              banda p25–p75: {fmtCorto(c.banda_p25)} – {fmtCorto(c.banda_p75)}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-6">
            <p className="text-sm font-medium">🧮 Total reconstruido</p>
            <p className="font-num text-3xl font-bold mt-2">{fmtCorto(c.total_tokens)}</p>
            <p className="text-xs text-muted-foreground mt-1 font-num">{fmt(c.total_llamadas)} llamadas</p>
          </div>
        </div>

        {/* Cobertura + ventanas */}
        <div className="mt-4 grid sm:grid-cols-2 gap-4">
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex justify-between items-baseline">
              <p className="text-sm font-medium">Cobertura medida</p>
              <p className="font-num text-2xl font-bold">{c.cobertura_pct ?? '—'} %</p>
            </div>
            <div className="mt-3 h-2 rounded-full bg-secondary overflow-hidden">
              <div className="h-full bg-emerald-400" style={{ width: `${c.cobertura_pct ?? 0}%` }} />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              la «nota de honestidad» del panel: qué parte de estas cifras es dato real y no estimación (objetivo ≥ 95 %)
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-6">
            <p className="text-sm font-medium mb-3">Ventanas de consumo</p>
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { l: '30 días', v: c.ventana_30d },
                { l: '7 días', v: c.ventana_7d },
                { l: 'hoy', v: c.hoy },
              ].map((w) => (
                <div key={w.l} className="rounded-lg bg-secondary/60 py-3">
                  <p className="font-num text-lg font-bold">{fmtCorto(w.v)}</p>
                  <p className="text-xs text-muted-foreground">{w.l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Por clon + por modelo */}
        <div className="mt-6 grid lg:grid-cols-2 gap-6">
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="font-semibold">¿Qué clon ha trabajado más? · 30 d</h3>
            <p className="text-xs text-muted-foreground mt-0.5 mb-4">tokens por perfil (el «motor» es la maquinaria de automejora)</p>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={datosClon} layout="vertical" margin={{ left: 8, right: 24 }}>
                  <XAxis type="number" hide />
                  <YAxis
                    type="category" dataKey="nombre" width={90}
                    tick={{ fill: 'hsl(215 14% 58%)', fontSize: 12 }} axisLine={false} tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: 'hsl(220 14% 14% / 0.4)' }}
                    contentStyle={{ background: 'hsl(222 20% 8%)', border: '1px solid hsl(220 13% 16%)', borderRadius: 8 }}
                    labelStyle={{ color: 'hsl(210 20% 92%)' }}
                    formatter={(v: number) => [fmt(v) + ' tokens', '']}
                  />
                  <Bar dataKey="tokens" radius={[0, 4, 4, 0]} isAnimationActive={false}>
                    {datosClon.map((d, i) => (
                      <Cell key={d.nombre} fill={COLORES_CLON[i % COLORES_CLON.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-6 pt-6 pb-4">
              <h3 className="font-semibold">¿De qué cerebros depende? · 30 d</h3>
              <p className="text-xs text-muted-foreground mt-0.5">los modelos de IA que hicieron el trabajo</p>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b border-border">
                  <th className="px-6 py-2 font-medium">Modelo</th>
                  <th className="px-2 py-2 font-medium text-right">Tokens</th>
                  <th className="px-6 py-2 font-medium text-right">Llamadas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {tokens.por_modelo.slice(0, 8).map((m) => (
                  <tr key={m.modelo}>
                    <td className="px-6 py-2.5 font-num text-xs">{m.modelo}</td>
                    <td className="px-2 py-2.5 text-right font-num">{fmtCorto(m.total)}</td>
                    <td className="px-6 py-2.5 text-right font-num text-muted-foreground">{fmt(m.llamadas)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  )
}
