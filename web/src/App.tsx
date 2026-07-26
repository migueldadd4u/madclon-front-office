import { usePanelData } from '@/lib/data'
import { Nav } from '@/sections/Nav'
import { Hero } from '@/sections/Hero'
import { QueEs } from '@/sections/QueEs'
import { Flota } from '@/sections/Flota'
import { Salud } from '@/sections/Salud'
import { Tokens } from '@/sections/Tokens'
import { Eficiencia } from '@/sections/Eficiencia'
import { Actividad } from '@/sections/Actividad'
import { Footer } from '@/sections/Footer'

export default function App() {
  const { data, error } = usePanelData()

  if (error) {
    return (
      <div className="min-h-screen grid place-items-center p-8 text-center">
        <div>
          <p className="text-red-400 font-semibold mb-2">No se pudieron cargar los datos del panel</p>
          <p className="text-muted-foreground text-sm font-num">{error}</p>
          <p className="text-muted-foreground text-sm mt-4">
            Ejecuta antes el exportador: <code className="font-num text-emerald-400">python exporter/export_panel.py</code>
          </p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <span className="size-2 rounded-full bg-emerald-400 animate-ping" />
          Cargando la sala de control…
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Nav overview={data.overview} />
      <main>
        <Hero data={data} />
        <QueEs />
        <Flota clones={data.clones} tokens={data.tokens} />
        <Salud overview={data.overview} clones={data.clones} />
        <Tokens tokens={data.tokens} />
        <Eficiencia tokens={data.tokens} serie={data.serie} />
        <Actividad overview={data.overview} />
      </main>
      <Footer manifest={data.manifest} />
    </div>
  )
}
