'use client'

// Capa de idiomas del Front Office — ES/EN con contexto React, persistida en localStorage.
// Las cadenas con datos se construyen con funciones en cada página usando `lang`.

import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'

export type Lang = 'es' | 'en'

const STR = {
  // ------------------------------------------------------------- navegación
  nav_panel: { es: 'Panel', en: 'Home' },
  nav_flota: { es: 'La flota', en: 'The fleet' },
  nav_salud: { es: 'Salud', en: 'Health' },
  nav_tokens: { es: 'Tokens', en: 'Tokens' },
  nav_eficiencia: { es: 'Eficiencia', en: 'Efficiency' },
  nav_actividad: { es: 'Actividad', en: 'Activity' },
  nav_historia: { es: 'Historia', en: 'Story' },
  nav_preguntas: { es: 'Preguntas', en: 'FAQ' },

  // ------------------------------------------------------------- chrome
  chrome_tagline: { es: 'Front office · cuadro de mando público', en: 'Front office · public dashboard' },
  chrome_footer_1: {
    es: 'MAD Clon · front office — solo cifras agregadas de sistema, sin datos personales',
    en: 'MAD Clon · front office — aggregated system figures only, no personal data'
  },
  chrome_footer_2: {
    es: 'Los paneles vivos nacen en el vault privado; un exportador trae aquí solo los agregados.',
    en: 'Live panels live in the private vault; an exporter brings only the aggregates here.'
  },
  cargando_error: { es: 'No se pudieron cargar los datos del panel', en: 'Panel data could not be loaded' },

  // ------------------------------------------------------------- portada
  home_titulo: { es: 'La sala de control del Clon de MAD', en: 'The MAD Clone control room' },
  home_intro: {
    es: 'Un equipo de inteligencia artificial que trabaja mientras Miguel vive su vida: lee el correo, clasifica lo importante, prepara decisiones, vigila el patrimonio y se mejora a sí mismo cada noche. Esta web es su cuadro de mandos — los mismos números que ve él, explicados para personas.',
    en: "A team of artificial intelligence that works while Miguel lives his life: it reads the mail, sorts what matters, prepares decisions, watches over the family's assets and improves itself every night. This website is its dashboard — the same numbers it sees, explained for people."
  },
  home_caption_datos: {
    es: 'solo cifras agregadas, sin información personal',
    en: 'aggregated figures only, no personal information'
  },
  home_stat_tokens: { es: 'trabajo de IA en 30 días', en: 'AI work in 30 days' },
  home_stat_clones: { es: 'clones con oficio propio', en: 'clones with their own craft' },
  home_stat_clones_det: { es: '+ el motor de automejora', en: '+ the self-improvement engine' },
  home_stat_gateways: { es: 'gateways vivos', en: 'live gateways' },
  home_stat_gateways_det: { es: 'canales de comunicación', en: 'communication channels' },
  home_stat_rutinas: { es: 'rutinas automáticas en verde', en: 'automatic routines in green' },
  home_stat_rutinas_ok: { es: 'todas al día', en: 'all on track' },
  home_stat_rutinas_err: { es: 'en error', en: 'in error' },
  home_quees_titulo: { es: '¿Qué es esto, en cuatro ideas?', en: 'What is this, in four ideas?' },
  home_quees_sub: {
    es: 'No hace falta saber lo que es un «second brain». Basta con esto:',
    en: "You don't need to know what a «second brain» is. This is enough:"
  },
  home_pulso_titulo: { es: 'El pulso de los últimos días', en: 'The pulse of the last few days' },
  home_pulso_caption: {
    es: 'dos voces por día: cuánto piensa y cuánto termina · la serie crece sola cada noche',
    en: 'two voices per day: how much it thinks and how much it finishes · the series grows by itself every night'
  },
  home_pulso_tooltip_tokens: { es: 'trabajo de IA', en: 'AI work' },
  home_pulso_tooltip_tareas: { es: 'tareas hechas', en: 'tasks done' },
  home_pulso_leyenda_tokens: {
    es: 'trabajo de IA (lo que piensa cada día)',
    en: 'AI work (how much it thinks each day)'
  },
  home_pulso_leyenda_tareas: {
    es: 'tareas completadas (lo que termina cada día)',
    en: 'tasks completed (what it finishes each day)'
  },

  // latido en vivo
  latido_ultima: { es: 'última señal de vida', en: 'last sign of life' },
  latido_ahora: { es: 'ahora mismo', en: 'right now' },
  latido_ago: { es: 'hace', en: 'ago' },
  latido_min: { es: 'min', en: 'min' },
  latido_h: { es: 'h', en: 'h' },
  latido_d: { es: 'd', en: 'd' },

  // un día en la vida del clon
  dia_titulo: { es: 'Un día en la vida del clon', en: 'A day in the life of the clone' },
  dia_caption: {
    es: 'cada punto es una rutina real, a la hora en que corrió por última vez',
    en: 'each dot is a real routine, at the hour it last ran'
  },
  dia_ahora: { es: 'ahora', en: 'now' },
  dia_leyenda: {
    es: 'Mientras Miguel duerme, el clon hace su autoauditoría de madrugada; por la mañana prepara el día; y vigila el correo importante a todas horas. La línea indigo marca este instante.',
    en: 'While Miguel sleeps, the clone runs its self-audit before dawn; in the morning it prepares the day; and it watches important mail around the clock. The indigo line marks this very moment.'
  },

  // insignias
  ins_titulo: { es: 'Insignias del sistema', en: 'System badges' },
  ins_caption: {
    es: 'hitos reales, desbloqueados con las cifras públicas de este panel',
    en: "real milestones, unlocked with this dashboard's public figures"
  },
  ins_ok: { es: 'desbloqueada', en: 'unlocked' },

  // easter egg consola
  consola_titulo: { es: 'consola · pulso del sistema', en: 'console · system pulse' },
  consola_logo_alt: { es: 'logotipo MAD Clon', en: 'MAD Clon logo' },
  consola_dias: { es: 'días de vida', en: 'days alive' },
  consola_trabajo: { es: 'trabajo de IA (30 d)', en: 'AI work (30 d)' },
  consola_rutinas: { es: 'rutinas', en: 'routines' },
  consola_verde: { es: 'en verde', en: 'in green' },
  consola_gateways: { es: 'gateways vivos', en: 'live gateways' },
  consola_cobertura: { es: 'cobertura medida', en: 'measured coverage' },
  consola_propuestas: { es: 'propuestas esperando a Miguel', en: 'proposals waiting for Miguel' },
  consola_salud: { es: 'salud', en: 'health' },
  consola_cierra: { es: '$ pulsa Esc o toca fuera para cerrar', en: '$ press Esc or tap outside to close' },

  // comparador antes/después
  ab_titulo: { es: 'El clon de antes vs el clon de hoy', en: 'The clone before vs the clone today' },
  ab_caption: {
    es: 'la línea base congelada frente al dato de hoy, en la misma escala',
    en: 'the frozen baseline against today’s figure, on the same scale'
  },
  ab_antes: { es: 'antes', en: 'before' },
  ab_hoy: { es: 'hoy', en: 'today' },

  // coste en euros (estimado)
  eur_titulo: { es: '¿Y todo eso, en euros?', en: 'And all that, in euros?' },
  eur_valor: { es: 'valor de mercado estimado del trabajo de 30 días', en: 'estimated market value of 30 days of work' },
  eur_nota: {
    es: 'Estimación orientativa: ~3 € por millón de tokens, un precio medio típico de API. No es un gasto real.',
    en: 'Ballpark estimate: ~€3 per million tokens, a typical average API price. It is not a real expense.'
  },
  eur_cero: {
    es: 'gasto por uso variable este mes: 0 € — el clon funciona con planes ya pagados y con modelos que corren en casa',
    en: 'pay-per-use spend this month: €0 — the clone runs on already-paid plans and on models hosted at home'
  },

  // frase de estado (plantillas)
  frase_tranquilo: { es: 'Hoy el sistema respira tranquilo', en: 'Today the system breathes easy' },
  frase_bien: { es: 'Hoy el sistema va bien, con un deber pendiente', en: 'Today the system is doing well, with one pending chore' },
  frase_atencion: { es: 'Hoy el sistema pide atención', en: 'Today the system asks for attention' },
  frase_rutinas_de: { es: 'de', en: 'of' },
  frase_rutinas_fin: { es: 'rutinas al día', en: 'routines on track' },
  frase_puertas: { es: 'puertas de entrada abiertas', en: 'entry doors open' },
  frase_aviso_1: { es: 'aviso menor en el motor', en: 'minor warning in the engine' },
  frase_aviso_n: { es: 'avisos menores en el motor', en: 'minor warnings in the engine' },
  frase_propuestas: {
    es: 'propuestas del clon esperan el sí o el no de Miguel',
    en: "clone proposals await Miguel's yes or no"
  },

  // ------------------------------------------------------------- el clon opina
  opina_titulo: { es: 'El clon opina', en: 'The clone speaks' },
  opina_caption: {
    es: 'escrito por el propio sistema con sus números de hoy · sin intervención humana',
    en: 'written by the system itself from today’s numbers · no human involved'
  },

  // ------------------------------------------------------------- flota
  flota_titulo: { es: 'La flota: siete clones, siete oficios', en: 'The fleet: seven clones, seven crafts' },
  flota_intro_1: {
    es: 'El Clon de MAD no es una sola mente: son siete perfiles especializados que comparten la misma memoria. Cada uno atiende un territorio de la vida de Miguel — la empresa, el patrimonio, la familia, las ideas — y un octavo actor, el',
    en: "The MAD Clone is not a single mind: it is seven specialized profiles sharing the same memory. Each one attends a territory of Miguel's life — the company, the assets, the family, the ideas — and an eighth actor, the"
  },
  flota_intro_2: { es: 'motor', en: 'engine' },
  flota_intro_3: {
    es: ', se dedica a mejorar a los demás. La barra muestra cuánto ha trabajado cada uno en los últimos 30 días.',
    en: ', works on improving the others. The bar shows how much each one has worked in the last 30 days.'
  },
  flota_correo: { es: 'correo', en: 'mail' },
  flota_agendas: { es: 'agendas', en: 'calendars' },
  flota_trabajo: { es: 'trabajo 30 d', en: 'work 30 d' },
  flota_tokens: { es: 'tokens', en: 'tokens' },

  // ------------------------------------------------------------- salud
  salud_titulo: { es: 'Salud del sistema', en: 'System health' },
  salud_intro: {
    es: 'Un guardián automático comprueba cada hora que el clon puede leer el correo y las agendas. Si algo falla, el panel lo grita antes de que se note.',
    en: 'An automatic watchdog checks every hour that the clone can read mail and calendars. If something fails, the dashboard shouts it before anyone notices.'
  },
  salud_global: { es: 'estado global', en: 'global status' },
  salud_accesos: { es: 'Accesos vigilados', en: 'Watched accesses' },
  salud_accesos_sub: {
    es: 'correos y agendas que el clon necesita para trabajar',
    en: 'mailboxes and calendars the clone needs to work'
  },
  salud_integracion: { es: 'Integración', en: 'Integration' },
  salud_detalle: { es: 'Detalle', en: 'Detail' },
  salud_ultimo_ok: { es: 'Último OK', en: 'Last OK' },
  salud_ultimo_chequeo: { es: 'último chequeo del guardián', en: 'last watchdog check' },
  salud_puertas: { es: 'Puertas de entrada vivas', en: 'Live entry doors' },
  salud_puertas_sub: {
    es: 'los procesos por los que Miguel habla con su clon',
    en: 'the processes through which Miguel talks to his clone'
  },
  salud_motor: { es: 'motor', en: 'engine' },
  salud_sin_problemas: { es: 'sin problemas', en: 'no issues' },
  salud_avisos: { es: 'aviso(s)', en: 'warning(s)' },
  salud_rutinas: { es: 'Rutinas automáticas', en: 'Automatic routines' },
  salud_rutinas_sub: {
    es: 'lo que el sistema hace solo cada día o cada semana',
    en: 'what the system does by itself every day or week'
  },

  // ------------------------------------------------------------- tokens
  tokens_titulo: { es: '¿Cuánto trabaja y quién lo hace?', en: 'How much work, and who does it?' },
  tokens_intro_1: {
    es: 'La IA se paga por tokens: la unidad con que se mide el texto (un token ≈ 3-4 letras; una página son unos 500). Cada cifra dice de dónde viene: medida (la dio el proveedor, exacta) o estimada (calculada, porque ese proveedor no informa). Nunca se mezclan.',
    en: 'AI is paid for in tokens: the unit used to measure text (one token ≈ 3-4 letters; a page is about 500). Every figure says where it comes from: measured (reported by the provider, exact) or estimated (calculated, because that provider does not report). They are never mixed.'
  },
  tokens_medido: { es: '✅ Medido por el proveedor', en: '✅ Measured by the provider' },
  tokens_llamadas: { es: 'llamadas', en: 'calls' },
  tokens_estimado: { es: '≈ Estimado (pasado ciego)', en: '≈ Estimated (blind past)' },
  tokens_banda: { es: 'banda p25–p75', en: 'p25–p75 band' },
  tokens_total: { es: '🧮 Total reconstruido', en: '🧮 Reconstructed total' },
  tokens_cobertura: { es: 'Cobertura medida', en: 'Measured coverage' },
  tokens_cobertura_caption: {
    es: 'la «nota de honestidad» del panel: qué parte de estas cifras es dato real y no estimación (objetivo ≥ 95 %)',
    en: 'the dashboard’s “honesty grade”: how much of these figures is real data and not estimation (goal ≥ 95 %)'
  },
  tokens_ventanas: { es: 'Ventanas de consumo', en: 'Consumption windows' },
  tokens_30d: { es: '30 días', en: '30 days' },
  tokens_7d: { es: '7 días', en: '7 days' },
  tokens_hoy: { es: 'hoy', en: 'today' },
  tokens_por_clon: { es: '¿Qué clon ha trabajado más? · 30 d', en: 'Which clone worked the most? · 30 d' },
  tokens_por_clon_sub: {
    es: 'tokens por perfil (el «motor» es la maquinaria de automejora)',
    en: 'tokens per profile (the “engine” is the self-improvement machinery)'
  },
  tokens_por_modelo: { es: '¿De qué cerebros depende? · 30 d', en: 'Which brains does it rely on? · 30 d' },
  tokens_por_modelo_sub: { es: 'los modelos de IA que hicieron el trabajo', en: 'the AI models that did the work' },
  tokens_modelo: { es: 'Modelo', en: 'Model' },

  // ------------------------------------------------------------- eficiencia
  ef_titulo: { es: '¿Está mejorando el clon?', en: 'Is the clone improving?' },
  ef_intro_1: { es: 'Desde el', en: 'Since' },
  ef_intro_2: {
    es: 'hay una línea base congelada: la foto del «antes». Cada indicador compara contra ella en su propia dirección — en unas cosas mejorar es subir (tareas hechas) y en otras es bajar (tokens por tarea).',
    en: 'there is a frozen baseline: the “before” picture. Every indicator compares against it in its own direction — for some, improving means going up (tasks done) and for others, going down (tokens per task).'
  },
  ef_soporte: { es: 'soporte de la lectura', en: 'reading support' },
  ef_g1: { es: '⚙️ Eficiencia', en: '⚙️ Efficiency' },
  ef_g1_sub: { es: 'lo que cuesta el trabajo', en: 'what the work costs' },
  ef_g2: { es: '🎯 Eficacia', en: '🎯 Effectiveness' },
  ef_g2_sub: { es: 'el trabajo que sale', en: 'the work that gets done' },
  ef_g3: { es: '🔍 Honestidad', en: '🔍 Honesty' },
  ef_g3_sub: { es: 'fiabilidad de la propia medida', en: 'reliability of the measurement itself' },
  ef_base: { es: 'base', en: 'baseline' },
  ef_indice: { es: 'El índice, día a día', en: 'The index, day by day' },
  ef_indice_sub: {
    es: 'tokens del motor por tarea hecha — si baja, el clon hace lo mismo gastando menos',
    en: 'engine tokens per task done — if it drops, the clone does the same spending less'
  },
  ef_serie_nace_1: { es: 'La serie diaria acaba de nacer', en: 'The daily series has just been born' },
  ef_serie_nace_2: {
    es: 'Cada día a las 03:00 se añade un punto — vuelve en una semana y verás la curva.',
    en: 'A point is added every day at 03:00 — come back in a week and you will see the curve.'
  },
  ef_intervenciones: { es: 'Intervenciones: ¿sirvió lo que cambiamos?', en: 'Interventions: did what we changed work?' },
  ef_intervenciones_sub: {
    es: 'cada mejora aplicada se anota y se juzga sola comparando su KPI antes y después',
    en: 'every applied improvement is logged and judged by comparing its KPI before and after'
  },
  ef_sin_intervenciones: {
    es: 'todavía no hay intervenciones registradas',
    en: 'no interventions recorded yet'
  },

  // ------------------------------------------------------------- actividad
  act_titulo: { es: '¿Qué espera de Miguel ahora mismo?', en: 'What is waiting for Miguel right now?' },
  act_intro: {
    es: 'El clon prepara; el humano decide. Esto es lo que hay encima de la mesa — solo cantidades, el contenido vive a salvo en el vault privado.',
    en: 'The clone prepares; the human decides. This is what is on the table — quantities only, the content lives safely in the private vault.'
  },
  act_propuestas: { es: 'propuestas esperando el sí o el no', en: 'proposals awaiting a yes or no' },
  act_bandeja: { es: 'capturas sin clasificar', en: 'captures not yet sorted' },
  act_esperas: { es: 'respuestas de terceros vencidas', en: 'overdue third-party replies' },
  act_decisiones: { es: 'decisiones abiertas del sistema', en: 'open system decisions' },
  act_motor: { es: 'El motor que se mejora solo · 7 días', en: 'The engine that improves itself · 7 days' },
  act_motor_sub_1: {
    es: 'cada noche se autoaudita y propone mejoras · coste en factura variable:',
    en: 'it audits itself and proposes improvements every night · metered-bill cost:'
  },
  act_hechas: { es: 'mejoras completadas', en: 'completed improvements' },
  act_pendientes: { es: 'pendientes', en: 'pending' },
  act_aparcadas: { es: 'aparcadas', en: 'parked' },
  act_bloqueadas: { es: 'bloqueadas', en: 'blocked' },
  act_llamadas_consejo: { es: 'llamadas al consejo de modelos · reparto', en: 'calls to the model council · split' },
  act_personas: { es: 'La memoria de las personas', en: 'The memory of people' },
  act_personas_sub: {
    es: 'fichas curadas de la red de contactos — quien es quién, de qué se habló, qué se debe',
    en: 'curated records of the contact network — who is who, what was discussed, what is owed'
  },
  act_fichas: { es: 'fichas curadas', en: 'curated records' },
  act_staged: { es: 'esperando revisión humana', en: 'awaiting human review' },
  act_personas_texto: {
    es: 'Cada ficha pasa por un control de calidad: la IA propone, pero fusionar o dar por buena una identidad exige evidencia. Nadie entra en la memoria por la puerta de atrás.',
    en: 'Every record goes through quality control: the AI proposes, but merging or validating an identity requires evidence. No one enters the memory through the back door.'
  },

  // ------------------------------------------------------------- historia
  his_titulo: { es: 'La historia del clon', en: 'The story of the clone' },
  his_intro: {
    es: 'Cómo un experimento de memoria se convirtió en un equipo de IA que trabaja cada día. Cada fecha de esta línea corresponde a una bitácora real escrita por el propio sistema.',
    en: 'How a memory experiment became a team of AI working every day. Every date on this line matches a real logbook entry written by the system itself.'
  },
  his_dias: { es: 'días de vida', en: 'days of life' },
  his_dias_det: { es: 'desde el 14 de abril de 2026', en: 'since April 14, 2026' },
  his_bitacoras: { es: 'bitácoras escritas', en: 'logbook entries written' },
  his_bitacoras_det: { es: 'el clon documenta su propio trabajo', en: 'the clone documents its own work' },
  his_clones: { es: 'clones con oficio', en: 'clones with a craft' },
  his_tokens_det: { es: 'y contando, cada noche', en: 'and counting, every night' },

  // ------------------------------------------------------------- preguntas
  faq_titulo: { es: 'Preguntas que la gente hace', en: 'Questions people ask' },
  faq_intro: {
    es: 'Lo que nos preguntan cuando enseñamos el clon por primera vez — respondido sin tecnicismos.',
    en: 'What we get asked when we show the clone for the first time — answered without jargon.'
  }
} as const

export type StrKey = keyof typeof STR

type LangCtx = { lang: Lang; setLang: (l: Lang) => void; t: (k: StrKey) => string }

const Ctx = createContext<LangCtx>({ lang: 'es', setLang: () => {}, t: k => STR[k].es })

export const LangProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<Lang>('es')

  useEffect(() => {
    const guardado = window.localStorage.getItem('madclon-lang')

    if (guardado === 'en' || guardado === 'es') setLangState(guardado)
  }, [])

  const setLang = (l: Lang) => {
    setLangState(l)
    window.localStorage.setItem('madclon-lang', l)
  }

  const t = (k: StrKey): string => STR[k]?.[lang] ?? STR[k]?.es ?? k

  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>
}

export const useLang = () => useContext(Ctx)
