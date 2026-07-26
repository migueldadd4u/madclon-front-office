import type { ClonesData, TokensData } from '@/types'
import { fmtCorto } from '@/lib/data'
import { Bot, Briefcase, Landmark, Heart, Lightbulb, Gavel, Wrench, Mail, CalendarDays } from 'lucide-react'

const ICONOS: Record<string, typeof Bot> = {
  clon: Bot,
  ceo: Briefcase,
  patrimonio: Landmark,
  padre: Heart,
  ideas: Lightbulb,
  licitador: Gavel,
  tecnico: Wrench,
}

export function Flota({ clones, tokens }: { clones: ClonesData; tokens: TokensData }) {
  const consumo = new Map(tokens.por_clon.map((c) => [c.clon, c.tokens ?? 0]))
  const maxConsumo = Math.max(...consumo.values(), 1)

  return (
    <section id="flota" className="border-t border-border/60">
      <div className="mx-auto max-w-6xl px-4 py-20">
        <h2 className="text-3xl font-bold tracking-tight">La flota: siete clones, siete oficios</h2>
        <p className="mt-3 text-muted-foreground max-w-3xl leading-relaxed">
          El Clon de MAD no es una sola mente: son <strong className="text-foreground">siete perfiles especializados</strong>{' '}
          que comparten la misma memoria. Cada uno atiende un territorio de la vida de Miguel — la empresa,
          el patrimonio, la familia, las ideas — y un octavo actor, el <em>motor</em>, se dedica a mejorar
          a los demás. La barra muestra cuánto ha trabajado cada uno en los últimos 30 días.
        </p>

        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {clones.clones.map((c) => {
            const Icon = ICONOS[c.perfil] ?? Bot
            const usado = consumo.get(c.perfil) ?? 0
            return (
              <article key={c.perfil} className="rounded-xl border border-border bg-card p-6 flex flex-col">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-lg bg-emerald-400/10 grid place-items-center">
                    <Icon className="size-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold capitalize">{c.perfil}</h3>
                    <p className="text-xs text-muted-foreground">{c.rol}</p>
                  </div>
                </div>
                {c.mision && (
                  <p className="mt-4 text-sm text-muted-foreground leading-relaxed flex-1">{c.mision}</p>
                )}
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {c.canales.map((canal) => (
                    <span key={canal} className="text-xs rounded-full border border-border px-2 py-0.5 text-muted-foreground">
                      {canal}
                    </span>
                  ))}
                  {c.correo && (
                    <span className="text-xs rounded-full border border-border px-2 py-0.5 text-muted-foreground inline-flex items-center gap-1">
                      <Mail className="size-3" /> correo
                    </span>
                  )}
                  {c.calendarios.length > 0 && (
                    <span className="text-xs rounded-full border border-border px-2 py-0.5 text-muted-foreground inline-flex items-center gap-1">
                      <CalendarDays className="size-3" /> {c.calendarios.length} agendas
                    </span>
                  )}
                </div>
                <div className="mt-5">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                    <span>trabajo 30 d</span>
                    <span className="font-num">{fmtCorto(usado)} tokens</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-400/80"
                      style={{ width: `${Math.max((usado / maxConsumo) * 100, usado > 0 ? 2 : 0)}%` }}
                    />
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
