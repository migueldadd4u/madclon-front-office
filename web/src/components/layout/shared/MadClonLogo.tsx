// React Imports
import type { SVGAttributes } from 'react'

// Logotipo MAD Clon — M constelación (red neuronal) sobre degradado indigo→teal
// Fuente editable: front-office/brand/madclon-logo.svg
const MadClonLogo = (props: SVGAttributes<SVGElement>) => {
  return (
    <svg width='30' height='30' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg' {...props}>
      <defs>
        <linearGradient id='mc-side' x1='0' y1='0' x2='100' y2='100' gradientUnits='userSpaceOnUse'>
          <stop offset='0' stopColor='#666CFF' />
          <stop offset='1' stopColor='#06B999' />
        </linearGradient>
      </defs>
      <rect x='0' y='0' width='100' height='100' rx='24' fill='url(#mc-side)' />
      <path
        d='M26 74 V32 L50 56 L74 32 V74'
        fill='none'
        stroke='#ffffff'
        strokeWidth='8.5'
        strokeLinecap='round'
        strokeLinejoin='round'
        opacity='0.96'
      />
      <circle cx='26' cy='74' r='6.4' fill='#ffffff' />
      <circle cx='26' cy='30' r='6.4' fill='#ffffff' />
      <circle cx='50' cy='60' r='6.4' fill='#ffffff' />
      <circle cx='74' cy='30' r='6.4' fill='#ffffff' />
      <circle cx='74' cy='74' r='6.4' fill='#ffffff' />
    </svg>
  )
}

export default MadClonLogo
