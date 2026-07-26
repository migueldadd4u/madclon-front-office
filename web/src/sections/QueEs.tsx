import { Inbox, Brain, Hand, TrendingUp } from 'lucide-react'

const pasos = [
  {
    icon: Inbox,
    titulo: 'Captura',
    texto:
      'Todo lo que llega — correos, WhatsApp, notas, citas — entra en una bandeja única. Nada se pierde: cada cosa queda clasificada o esperando su turno.',
  },
  {
    icon: Brain,
    titulo: 'Piensa',
    texto:
      'Un consejo de varios modelos de IA (GPT, Grok, Kimi, GLM…) contrasta opiniones antes de proponer nada. Las decisiones importantes siempre las toma el humano.',
  },
  {
    icon: Hand,
    titulo: 'Actúa',
    texto:
      'Prepara borradores, persigue respuestas que se deben, monta dossieres y deja las propuestas listas para que Miguel solo tenga que decir sí o no.',
  },
  {
    icon: TrendingUp,
    titulo: 'Se mide',
    texto:
      'Cada noche se audita a sí mismo: cuánto gasta, cuánto falla, si hoy es mejor que ayer. Los números de abajo son esa autoauditoría, en directo.',
  },
]

export function QueEs() {
  return (
    <section id="que-es" className="border-t border-border/60">
      <div className="mx-auto max-w-6xl px-4 py-20">
        <h2 className="text-3xl font-bold tracking-tight">¿Qué es esto, en cuatro ideas?</h2>
        <p className="mt-3 text-muted-foreground max-w-2xl">
          No hace falta saber lo que es un «second brain». Basta con esto:
        </p>
        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {pasos.map((p, i) => (
            <div key={p.titulo} className="rounded-xl border border-border bg-card p-6 relative">
              <span className="absolute top-4 right-5 font-num text-xs text-muted-foreground">0{i + 1}</span>
              <p.icon className="size-6 text-emerald-400 mb-4" />
              <h3 className="font-semibold text-lg">{p.titulo}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{p.texto}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
