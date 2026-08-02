import type { MetadataRoute } from 'next'

// Export estático (GitHub Pages): el robots se prerenderiza en el build.
export const dynamic = 'force-static'

// Una web que enseña un clon de IA no puede esconderse de los bots de IA:
// todos bienvenidos, con el sitemap señalado para que nadie adivine rutas.
// Mismo patrón que add4u-web.
const aiBots = ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-Web', 'anthropic-ai', 'PerplexityBot', 'Google-Extended', 'Googlebot', 'Bingbot', 'CCBot', 'Applebot-Extended']

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/' }, ...aiBots.map(userAgent => ({ userAgent, allow: '/' }))],
    sitemap: 'https://migueldadd4u.github.io/madclon-front-office/sitemap.xml'
  }
}
