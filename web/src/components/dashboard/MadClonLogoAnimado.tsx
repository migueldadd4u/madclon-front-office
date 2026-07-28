// Logotipo MAD Clon animado — en la portada, los nodos de la M constelación
// aparecen uno a uno y el trazo se dibuja conectándolos (una sola vez, al cargar).
// Decorativo (aria-hidden): el nombre de la marca ya está en el título.
// Accesible: con prefers-reduced-motion todo aparece quieto y completo.
// Geometría idéntica a MadClonLogo.tsx / brand/madclon-favicon.svg.

type Props = { size?: number }

const MadClonLogoAnimado = ({ size = 56 }: Props) => (
  <>
    <style>{`
      .mca-path { stroke-dasharray: 172; stroke-dashoffset: 172; animation: mca-dibuja 1.15s .55s cubic-bezier(.4,0,.2,1) forwards; }
      .mca-nodo { opacity: 0; transform: scale(0); transform-box: fill-box; transform-origin: center; animation: mca-pop .45s cubic-bezier(.34,1.56,.64,1) forwards; }
      @keyframes mca-dibuja { to { stroke-dashoffset: 0; } }
      @keyframes mca-pop { to { opacity: 1; transform: scale(1); } }
      @media (prefers-reduced-motion: reduce) {
        .mca-path { stroke-dashoffset: 0; animation: none; }
        .mca-nodo { opacity: 1; transform: none; animation: none; }
      }
    `}</style>
    <svg width={size} height={size} viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg' aria-hidden='true'>
      <defs>
        <linearGradient id='mca-g' x1='0' y1='0' x2='100' y2='100' gradientUnits='userSpaceOnUse'>
          <stop offset='0' stopColor='#7A7FFF' />
          <stop offset='0.55' stopColor='#4E8FE8' />
          <stop offset='1' stopColor='#06C9A8' />
        </linearGradient>
      </defs>
      <rect x='0' y='0' width='100' height='100' rx='26' fill='url(#mca-g)' />
      <path
        className='mca-path'
        d='M24 76 V30 L50 58 L76 30 V76'
        fill='none'
        stroke='#ffffff'
        strokeWidth='11'
        strokeLinecap='round'
        strokeLinejoin='round'
        opacity='0.97'
      />
      <circle className='mca-nodo' style={{ animationDelay: '0s' }} cx='24' cy='76' r='8.6' fill='#ffffff' />
      <circle className='mca-nodo' style={{ animationDelay: '.12s' }} cx='24' cy='28' r='8.6' fill='#ffffff' />
      <circle className='mca-nodo' style={{ animationDelay: '.24s' }} cx='50' cy='62' r='8.6' fill='#ffffff' />
      <circle className='mca-nodo' style={{ animationDelay: '.36s' }} cx='76' cy='28' r='8.6' fill='#ffffff' />
      <circle className='mca-nodo' style={{ animationDelay: '.48s' }} cx='76' cy='76' r='8.6' fill='#ffffff' />
    </svg>
  </>
)

export default MadClonLogoAnimado
