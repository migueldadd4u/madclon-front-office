// Template del dashboard: se re-monta en cada navegación y aplica
// la entrada suave de página (fo-page-in, desactivada con reduced-motion).
export default function DashboardTemplate({ children }: { children: React.ReactNode }) {
  return <div className='fo-page-in'>{children}</div>
}
