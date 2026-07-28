// React Imports
import type { SVGAttributes } from 'react'

// Logotipo MAD Clon — M constelación (red neuronal) sobre degradado indigo→teal
// Fuente editable: front-office/brand/madclon-favicon.svg
const MadClonLogo = (props: SVGAttributes<SVGElement>) => {
  return (
    <svg width='30' height='30' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg' {...props}>
      <defs>
        <linearGradient id='mc-side' x1='0' y1='0' x2='100' y2='100' gradientUnits='userSpaceOnUse'>
          <stop offset='0' stopColor='#7A7FFF' />
          <stop offset='0.55' stopColor='#4E8FE8' />
          <stop offset='1' stopColor='#06C9A8' />
        </linearGradient>
      </defs>
      <rect x='0' y='0' width='100' height='100' rx='26' fill='url(#mc-side)' />
      <path
        d='M24 76 V30 L50 58 L76 30 V76'
        fill='none'
        stroke='#ffffff'
        strokeWidth='11'
        strokeLinecap='round'
        strokeLinejoin='round'
        opacity='0.97'
      />
      <circle cx='24' cy='76' r='8.6' fill='#ffffff' />
      <circle cx='24' cy='28' r='8.6' fill='#ffffff' />
      <circle cx='50' cy='62' r='8.6' fill='#ffffff' />
      <circle cx='76' cy='28' r='8.6' fill='#ffffff' />
      <circle cx='76' cy='76' r='8.6' fill='#ffffff' />
    </svg>
  )
}

export default MadClonLogo
