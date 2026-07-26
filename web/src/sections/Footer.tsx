import type { Manifest } from '@/types'
import { ShieldCheck } from 'lucide-react'

export function Footer({ manifest }: { manifest: Manifest }) {
  const generado = new Date(manifest.generado).toLocaleString('es-ES', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto max-w-6xl px-4 py-10 flex flex-col sm:flex-row justify-between gap-6 text-sm text-muted-foreground">
        <div>
          <p className="font-semibold text-foreground">MAD CLON · front office</p>
          <p className="mt-1 max-w-md">
            Cuadro de mando público del Clon de MAD. Los paneles vivos nacen en el vault privado;
            un exportador trae aquí solo los agregados.
          </p>
        </div>
        <div className="sm:text-right">
          <p className="flex items-center sm:justify-end gap-1.5">
            <ShieldCheck className="size-4 text-emerald-400" />
            sin datos personales: solo cifras de sistema
          </p>
          <p className="mt-1 font-num text-xs">datos del {generado}</p>
          <p className="font-num text-xs mt-0.5">fuentes: {manifest.fuentes.join(' · ')}</p>
        </div>
      </div>
    </footer>
  )
}
