'use client'

// Capa de idiomas del Front Office — ES/EN con contexto React, persistida en localStorage.
// Las cadenas con datos se construyen con funciones en cada página usando `lang`.

import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'

export type Lang = 'es' | 'en'

const STR = {
  document_title: {
    es: 'MAD Clon — el Clon de Miguel Ángel Domínguez',
    en: "MAD Clon — Miguel Ángel Domínguez's Clone"
  },

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
    es: 'Los paneles vivos nacen en la memoria privada del sistema (el «vault»); un exportador trae aquí solo los agregados.',
    en: "Live panels are born in the system's private memory (the «vault»); an exporter brings only the aggregates here."
  },
  cargando_error: { es: 'No se pudieron cargar los datos del panel', en: 'Panel data could not be loaded' },
  footer_version: {
    es: '{v} · generado el {fecha} (hora de Madrid)',
    en: '{v} · built on {fecha} (Madrid time)'
  },
  share_copiar: { es: 'Copiar enlace', en: 'Copy link' },
  share_copiado: { es: '¡Enlace copiado!', en: 'Link copied!' },
  sello_puerta: {
    es: 'Entrar al panel privado del Clon de MAD — te pedirá identificarte',
    en: 'Enter the private panel of the Clon de MAD — it will ask you to identify yourself'
  },
  menu_abrir: { es: 'Abrir o cerrar el menú', en: 'Open or close the menu' },
  kiosk_entrar: { es: 'Modo presentación: oculta menús y muestra solo el panel', en: 'Presentation mode: hides menus and shows only the dashboard' },
  kiosk_salir: { es: 'Salir (Esc)', en: 'Exit (Esc)' },

  // atajos de teclado (g + letra para navegar, ? para la ayuda)
  atajos_boton: { es: 'Atajos de teclado', en: 'Keyboard shortcuts' },
  atajos_titulo: { es: 'Atajos de teclado', en: 'Keyboard shortcuts' },
  atajos_sub: {
    es: '«g» seguida de una letra te lleva a cada sección, sin soltar el teclado. «?» abre y cierra esta ayuda.',
    en: '«g» followed by a letter takes you to each section, without leaving the keyboard. «?» opens and closes this help.'
  },
  atajos_ayuda_fila: { es: 'mostrar u ocultar esta ayuda', en: 'show or hide this help' },

  // ------------------------------------------------------------- portada
  home_titulo: { es: 'La sala de control del Clon de MAD', en: 'The MAD Clone control room' },
  home_intro: {
    es: 'Un equipo de inteligencia artificial que trabaja mientras Miguel Ángel Domínguez (MAD) vive su vida: lee el correo, clasifica lo importante, prepara decisiones, vigila el patrimonio y se mejora a sí mismo cada noche. Esta web es su cuadro de mandos — los mismos números que ve él, explicados para personas.',
    en: "A team of artificial intelligence that works while Miguel Ángel Domínguez (MAD) lives his life: it reads the mail, sorts what matters, prepares decisions, watches over the family's assets and improves itself every night. This website is its dashboard — the same numbers it sees, explained for people."
  },
  sin_dato_valor: { es: 'sin dato', en: 'no data' },
  sin_dato_pie: {
    es: 'el refresco de esta noche no publicó esta cifra; vuelve mañana y estará',
    en: 'tonight’s refresh did not publish this figure; come back tomorrow and it will be here'
  },
  act_medido: {
    es: 'medido el {fecha} · se regenera solo cada noche',
    en: 'measured on {fecha} · regenerates by itself every night'
  },
  ef_intro_sin_fecha: {
    es: 'Hay una línea base congelada — la foto del «antes» —, aunque su fecha no viene en los datos de hoy. Cada indicador compara contra ella en su propia dirección — en unas cosas mejorar es subir (tareas hechas) y en otras es bajar (tokens por tarea).',
    en: 'There is a frozen baseline — the «before» snapshot — although its date is missing from today’s data. Each indicator compares against it in its own direction — for some things improving means going up (tasks done) and for others going down (tokens per task).'
  },
  rancio_aviso: {
    es: 'Estos números son del {fecha}: el refresco nocturno lleva {horas} h sin correr. Lo decimos en vez de enseñarte un dato viejo con cara de nuevo.',
    en: 'These figures are from {fecha}: the nightly refresh has not run for {horas} h. We say so instead of showing you an old number with a fresh face.'
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
  home_quees_titulo: { es: '¿Qué es esto, en {n} ideas?', en: 'What is this, in {n} ideas?' },
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

  // 404 con personalidad: el error se emite como si fuera el informativo de la noche.
  // El titular es el rótulo de portada; la cinta de abajo son los demás titulares.
  nf_canal: { es: 'Canal 404', en: 'Channel 404' },
  nf_directo: { es: 'En directo', en: 'Live' },
  nf_marca: { es: 'Última hora', en: 'Breaking news' },
  nf_titulo: {
    es: 'La página que buscabas no existe, y el enlace lo sabía',
    en: "The page you were looking for doesn't exist, and the link knew it"
  },
  nf_sub: {
    es: 'Ampliamos la información: o la dirección venía mal escrita, o la página se mudó sin avisar a nadie. Mientras el enlace da explicaciones, el Clon de MAD sigue trabajando: leyendo, clasificando y preparando el día.',
    en: 'More on this story: either the address was misspelled, or the page moved without telling anyone. While the link explains itself, MAD’s clone keeps working: reading, sorting and preparing the day.'
  },
  nf_boton: { es: 'Volver al panel', en: 'Back to the dashboard' },
  nf_pie: {
    es: 'Informativo del Clon de MAD · aquí solo se emiten cifras agregadas, sin datos personales',
    en: 'Newscast by MAD’s clone · only aggregated figures are broadcast here, no personal data'
  },
  nf_cinta_aria: { es: 'Titulares del informativo', en: 'Newscast headlines' },
  nf_cinta_pausa: { es: 'Parar los titulares', en: 'Stop the headlines' },
  nf_cinta_sigue: { es: 'Seguir con los titulares', en: 'Resume the headlines' },
  nf_cinta_1: {
    es: 'El enlace se acoge a su derecho a no declarar',
    en: 'The link declines to comment'
  },
  nf_cinta_2: {
    es: 'Fuentes cercanas al servidor apuntan a una errata en la dirección',
    en: 'Sources close to the server point to a typo in the address'
  },
  nf_cinta_3: {
    es: 'Continúa el operativo: se busca la página en el histórico del navegador',
    en: 'The search continues: the page was last seen in your browsing history'
  },
  nf_cinta_4: {
    es: 'El responsable asume toda la responsabilidad y, por supuesto, no dimite',
    en: 'Those responsible take full responsibility and, of course, refuse to resign'
  },
  nf_cinta_5: {
    es: 'La página no aparece; el Clon de MAD sí, y sigue con sus rutinas de siempre',
    en: 'The page is nowhere to be found; MAD’s clone is, and keeps to its usual routines'
  },
  nf_cinta_6: {
    es: 'El botón de esta pantalla, única salida conocida hacia el panel',
    en: 'The button on this screen: the only known way back to the dashboard'
  },

  // el clon te cuenta su noche
  noche_titulo: {
    es: 'Esta noche, mientras MAD dormía',
    en: 'Last night, while MAD was asleep'
  },
  noche_frase: {
    es: 'Soy el Clon de Miguel Ángel Domínguez. Pensé {tokens} tokens en {llamadas} llamadas, terminé {tareas} tareas y amanecí con todo {salud}. Nadie me lo pidió: son mis rutinas de cada noche.',
    en: "I am Miguel Ángel Domínguez's clone. I thought {tokens} tokens over {llamadas} calls, finished {tareas} tasks and woke up with everything {salud}. Nobody asked me to: these are my nightly routines."
  },
  noche_caption: {
    es: 'última noche medida: {fecha} · se actualiza solo cada madrugada',
    en: 'last measured night: {fecha} · updates by itself every early morning'
  },
  noche_chip_tokens: { es: '{tokens} tokens pensados', en: '{tokens} tokens thought' },
  noche_chip_tareas: { es: '{tareas} tareas terminadas', en: '{tareas} tasks finished' },
  noche_chip_llamadas: { es: '{llamadas} llamadas entre modelos', en: '{llamadas} calls between models' },
  noche_salud_verde: { es: 'en verde', en: 'in the green' },
  noche_salud_ambar: { es: 'en amarillo, con algún aviso', en: 'in amber, with a warning or two' },
  noche_salud_rojo: { es: 'en rojo, pidiendo atención', en: 'in the red, asking for attention' },

  // barra de progreso del día
  pd_frase: {
    es: 'El último día medido fue un {pct} % de un día normal: {tokens} tokens frente a un ritmo habitual de {media}.',
    en: 'The last measured day was {pct}% of a normal day: {tokens} tokens against a usual pace of {media}.'
  },
  pd_aria: {
    es: 'Progreso del último día medido frente a un día normal',
    en: 'Progress of the last measured day against a normal day'
  },
  home_pulso_leyenda_tokens: {
    es: 'trabajo de IA (lo que piensa cada día)',
    en: 'AI work (how much it thinks each day)'
  },
  home_pulso_leyenda_tareas: {
    es: 'tareas completadas (lo que termina cada día)',
    en: 'tasks completed (what it finishes each day)'
  },
  pulso_tooltip_pct: { es: '{pct} % de un día normal', en: '{pct}% of a normal day' },
  pulso_explora_aria: {
    es: 'Gráfico del pulso de los últimos días. Con las flechas izquierda y derecha recorres los días; con Escape sueltas la selección.',
    en: 'Pulse chart of the last few days. Use the left and right arrows to move through the days; Escape clears the selection.'
  },
  pulso_explora_hint: {
    es: 'con el foco en el gráfico, ← → recorre los días · Esc suelta',
    en: 'with focus on the chart, ← → moves through the days · Esc releases'
  },
  pulso_dia_sel: {
    es: '{fecha}: {tokens} de trabajo de IA y {tareas} tareas — un {pct} % de un día normal',
    en: '{fecha}: {tokens} of AI work and {tareas} tasks — {pct}% of a normal day'
  },

  // latido en vivo
  latido_ultima: { es: 'última señal de vida', en: 'last sign of life' },
  latido_ahora: { es: 'ahora mismo', en: 'right now' },
  latido_ago: { es: 'hace', en: 'ago' },
  latido_min: { es: 'min', en: 'min' },
  latido_h: { es: 'h', en: 'h' },
  latido_d: { es: 'd', en: 'd' },

  // menú lateral — botones de plegado (nombres accesibles)
  nav_cierra: { es: 'cerrar el menú', en: 'close the menu' },
  nav_fija: { es: 'fijar el menú abierto', en: 'pin the menu open' },
  nav_pliega: { es: 'plegar el menú', en: 'collapse the menu' },

  // print bonito — cabecera del informe en papel
  print_informe: {
    es: 'informe de una página · los mismos números de la web, en papel',
    en: 'one-page report · the same numbers as the website, on paper'
  },

  // modo alto contraste
  contraste_aria: { es: 'alto contraste', en: 'high contrast' },

  // offline — primera visita sin datos en caché
  offline_titulo: { es: 'Sin conexión y aún sin datos guardados', en: 'Offline and no saved data yet' },
  offline_texto: {
    es: 'Abre la web una vez con internet: a partir de ese momento, la portada y sus números funcionan también sin conexión.',
    en: 'Open the site once while online: from then on, the dashboard and its numbers work offline too.'
  },

  // sección «en revisión» — un documento no cargó o no validó; el resto sigue vivo
  revision_titulo: { es: 'Este bloque está en revisión', en: 'This section is under review' },
  revision_texto: {
    es: 'Sus datos no llegaron completos en el último refresco y preferimos no enseñarlos a medias. El resto del panel sigue disponible; este bloque vuelve solo con el próximo refresco.',
    en: 'Its data did not arrive complete in the last refresh and we would rather not show it half-baked. The rest of the dashboard is still available; this section returns on its own with the next refresh.'
  },

  // instantánea retenida por la fuente — estado protegido, no un error
  retenido_titulo: { es: 'Instantánea pública protegida', en: 'Public snapshot protected' },
  retenido_texto: {
    es: 'Los datos permanecen retenidos hasta que exista una proyección pública mínima y segura.',
    en: 'Data remains withheld until a minimal, safe public projection is available.'
  },
  retenido_fecha: { es: 'Comprobación de seguridad: {fecha}', en: 'Safety check: {fecha}' },

  // un día en la vida del clon
  dia_titulo: { es: 'Un día en la vida del clon', en: 'A day in the life of the clone' },
  dia_caption: {
    es: 'cada punto es una rutina real, a la hora en que corrió por última vez',
    en: 'each dot is a real routine, at the hour it last ran'
  },
  dia_ahora: { es: 'ahora', en: 'now' },
  dia_desliza: { es: 'desliza para ver las 24 h', en: 'swipe to see the full 24 h' },
  dia_leyenda: {
    es: 'Mientras MAD duerme, el Clon hace su autoauditoría de madrugada; por la mañana prepara el día; y vigila el correo importante a todas horas. La línea indigo marca este instante.',
    en: 'While MAD sleeps, the Clone runs its self-audit before dawn; in the morning it prepares the day; and it watches important mail around the clock. The indigo line marks this very moment.'
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
  consola_propuestas: { es: 'propuestas esperando a MAD', en: 'proposals waiting for MAD' },
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
    es: 'propuestas del Clon esperan el sí o el no de MAD',
    en: "clone proposals await MAD's yes or no"
  },

  // ------------------------------------------------------------- el clon opina
  opina_titulo: { es: 'El clon opina', en: 'The clone speaks' },
  opina_caption: {
    es: 'escrito por el propio sistema con sus números de hoy · sin intervención humana',
    en: 'written by the system itself from today’s numbers · no human involved'
  },

  // ------------------------------------------------------------- flota
  flota_titulo: { es: 'La flota: {n} clones, {n} oficios', en: 'The fleet: {n} clones, {n} crafts' },
  flota_intro_1: {
    es: 'El Clon de MAD no es una sola mente: son {n} perfiles especializados que comparten la misma memoria. Cada uno atiende un territorio de la vida de MAD — la empresa, el patrimonio, la familia, las ideas — y un actor más, el',
    en: "The MAD Clone is not a single mind: it is {n} specialized profiles sharing the same memory. Each one attends a territory of MAD's life — the company, the assets, the family, the ideas — and one more actor, the"
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
  flota_intro_4: {
    es: 'Pulsa cualquier tarjeta: debajo de cada clon hay más de lo que se ve.',
    en: 'Press any card: there is more underneath each clone than meets the eye.'
  },

  // anatomía del clon — lo que hay debajo de cada tarjeta
  anat_ver: { es: 'ver qué hay debajo', en: 'see what’s underneath' },
  anat_abrir_aria: { es: 'Ver qué hay debajo de {nombre}', en: 'See what’s underneath {nombre}' },
  anat_cerrar: { es: 'Cerrar', en: 'Close' },

  // navegación por capas — ninguna capa puede ser una trampa (ver REGLAS-COPY.md §4)
  capa_migas_aria: { es: 'Dónde estás', en: 'Where you are' },
  capa_flota: { es: 'Flota', en: 'Fleet' },
  capa_1: { es: 'capa 1', en: 'layer 1' },
  capa_2: { es: 'capa 2', en: 'layer 2' },
  capa_volver: { es: 'volver a la flota', en: 'back to the fleet' },
  capa_volver_pista: { es: 'o pulsa Esc, o el gesto de atrás', en: 'or press Esc, or the back gesture' },
  capa_anterior: { es: 'Clon anterior', en: 'Previous clone' },
  capa_siguiente: { es: 'Clon siguiente', en: 'Next clone' },
  capa_lateral_pista: { es: 'muévete entre clones sin volver atrás (← →)', en: 'move between clones without going back (← →)' },
  capa_posicion: { es: '{i} de {total}', en: '{i} of {total}' },
  capa_anuncio: {
    es: 'Estás en {nombre}, {pos} de la flota. Sigues dentro de la capa 2.',
    en: 'You are on {nombre}, {pos} of the fleet. You are still inside layer 2.'
  },
  anat_quees: {
    es: 'Un clon es una misión escrita que no se olvida, una memoria que crece cada noche, unas puertas por donde le llega el mundo, unas rutinas que corren solas de madrugada y un cerebro propio que piensa por él. Esto es lo que hay debajo de este:',
    en: 'A clone is a written mission it never forgets, a memory that grows every night, doors through which the world reaches it, routines that run by themselves in the early morning, and a brain of its own that thinks for it. This is what lies underneath this one:'
  },
  anat_puertas: { es: 'Sus puertas', en: 'Its doors' },
  anat_puertas_sub: {
    es: 'cada canal es una puerta por la que el mundo le llega — y por la que responde',
    en: 'each channel is a door through which the world reaches it — and through which it answers'
  },
  anat_conexiones: { es: 'Sus conexiones, en vivo', en: 'Its connections, live' },
  anat_conexiones_sub: {
    es: 'su correo y sus agendas, vigilados cada hora por un guardián automático',
    en: 'its mailbox and calendars, watched every hour by an automatic watchdog'
  },
  anat_senal: { es: 'última señal {x}', en: 'last signal {x}' },
  anat_sin_senal: { es: 'sin señal registrada', en: 'no signal recorded' },
  anat_sin_conexiones: {
    es: 'No tiene correo ni agendas propias: vive en {canales}, ligero a propósito.',
    en: 'No mailbox or calendars of its own: it lives on {canales}, light on purpose.'
  },
  anat_rutinas: { es: 'Sus rutinas de madrugada', en: 'Its early-morning routines' },
  anat_rutinas_sub: {
    es: 'trabajo que corre solo, de noche, sin que nadie lo pida',
    en: 'work that runs by itself, at night, without anyone asking'
  },
  anat_rutinas_compartidas: {
    es: 'No tiene rutinas propias: le sirven estas rutinas compartidas del sistema.',
    en: 'It has no routines of its own: these shared system routines serve it.'
  },
  anat_rutina_ultima: { es: 'última: {x}', en: 'last run: {x}' },
  anat_cerebro: { es: 'Su cerebro', en: 'Its brain' },
  anat_cerebro_router: {
    es: '{gateway}: el router principal — la puerta por la que piensa el director y reparte el trabajo a toda la flota.',
    en: '{gateway}: the main router — the door through which the conductor thinks and hands out work to the whole fleet.'
  },
  anat_cerebro_texto: {
    es: '{gateway}: la puerta por la que piensa este clon — su canal privado hacia los modelos de IA, independiente de los demás.',
    en: '{gateway}: the door through which this clone thinks — its private channel to the AI models, independent from the others.'
  },
  anat_cerebro_ausente: {
    es: 'su cerebro no aparece hoy en la lista de puertas vivas — si falta, el panel no lo inventa',
    en: 'its brain is not on today’s list of live doors — if it is missing, the dashboard does not invent it'
  },
  anat_peso: { es: 'Su peso en la orquesta', en: 'Its weight in the orchestra' },
  anat_peso_sub: {
    es: 'tokens de trabajo en los últimos 30 días — un {pct} % de todo el sistema',
    en: 'tokens of work in the last 30 days — {pct}% of the whole system'
  },
  anat_peso_frase_10: {
    es: 'De cada 10 tokens que piensa el sistema, {x} son suyos.',
    en: 'Out of every 10 tokens the system thinks, {x} are its own.'
  },
  anat_peso_frase_1000: {
    es: 'De cada 1.000 tokens que piensa el sistema, {x} son suyos.',
    en: 'Out of every 1,000 tokens the system thinks, {x} are its own.'
  },
  anat_peso_escala: {
    es: 'la escala, con toda la flota (cada barra es la parte del sistema que piensa un clon)',
    en: 'the scale, with the whole fleet (each bar is the share of the system one clone thinks)'
  },
  anat_mapa_titulo: { es: 'La orquesta, en un vistazo', en: 'The orchestra at a glance' },
  anat_mapa_sub: {
    es: '{n} oficios alrededor; el director reparte y recoge el trabajo',
    en: '{n} crafts around it; the conductor hands out and gathers the work'
  },
  anat_mapa_aria: {
    es: 'Esquema: el clon director en el centro coordina a los otros {n} clones, conectado a cada uno',
    en: 'Diagram: the conductor clone at the center coordinates the other {n} clones, connected to each one'
  },
  anat_cierre_clon: {
    es: 'El director que no duerme: mientras la casa descansa, reparte el trabajo de mañana.',
    en: 'The conductor that never sleeps: while the house rests, it hands out tomorrow’s work.'
  },
  anat_cierre_ceo: {
    es: 'Mira lejos para que nadie tenga que correr: su rutina diaria es la estrategia.',
    en: 'It looks far so nobody has to run: its daily routine is strategy.'
  },
  anat_cierre_patrimonio: {
    es: 'El guardián de lo que cuesta años construir: cada euro, vigilado mientras duermes.',
    en: 'The guardian of what takes years to build: every euro, watched while you sleep.'
  },
  anat_cierre_padre: {
    es: 'Su territorio no sale en ningún organigrama: es el tiempo que de verdad importa.',
    en: 'Its territory appears on no org chart: it is the time that truly matters.'
  },
  anat_cierre_ideas: {
    es: 'Aquí ninguna idea llega demasiado pronto ni demasiado rara: todas entran; algunas salen proyecto.',
    en: 'Here no idea arrives too early or too strange: they all come in; some leave as projects.'
  },
  anat_cierre_licitador: {
    es: 'Lee pliegos como otros leen el periódico: encuentra la oportunidad antes de que tenga nombre.',
    en: 'It reads public tenders the way others read the paper: it spots the opportunity before it has a name.'
  },
  anat_cierre_tecnico: {
    es: 'El mecánico de la flota: si los demás piensan sin tropezar, es porque pasó la noche afinando.',
    en: 'The fleet’s mechanic: if the others think without stumbling, it is because it spent the night tuning.'
  },

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
    es: 'los procesos por los que MAD habla con su Clon',
    en: 'the processes through which MAD talks to his clone'
  },
  salud_motor: { es: 'motor', en: 'engine' },
  salud_sin_problemas: { es: 'sin problemas', en: 'no issues' },
  salud_avisos: { es: 'aviso(s)', en: 'warning(s)' },
  salud_rutinas: { es: 'Rutinas automáticas', en: 'Automatic routines' },
  salud_rutinas_sub: {
    es: 'lo que el sistema hace solo cada día o cada semana',
    en: 'what the system does by itself every day or week'
  },
  salud_tabla_accesos: {
    es: 'tabla de accesos vigilados, desliza horizontalmente para verla entera',
    en: 'watched accesses table, swipe horizontally to see it all'
  },
  salud_tabla_rutinas: {
    es: 'tabla de rutinas automáticas, desliza horizontalmente para verla entera',
    en: 'automatic routines table, swipe horizontally to see it all'
  },

  // ------------------------------------------------------------- tokens
  tokens_titulo: { es: '¿Cuánto trabaja y quién lo hace?', en: 'How much work, and who does it?' },
  tokens_intro_1: {
    es: 'La IA se paga por tokens — palabras pensadas: la unidad con que se mide el texto (un token ≈ 3-4 letras; una página son unos 500). Cada cifra dice de dónde viene: medida (la dio el proveedor, exacta) o estimada (calculada, porque ese proveedor no informa). Nunca se mezclan.',
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
  tokens_tabla_region: {
    es: 'tabla de modelos, desliza horizontalmente para verla entera',
    en: 'models table, swipe horizontally to see it all'
  },

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
  act_titulo: { es: '¿Qué espera de MAD ahora mismo?', en: 'What is waiting for MAD right now?' },
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
  his_dias_det: { es: 'desde el {fecha}', en: 'since {fecha}' },
  his_bitacoras: { es: 'bitácoras escritas', en: 'logbook entries written' },
  his_bitacoras_det: { es: 'el clon documenta su propio trabajo', en: 'the clone documents its own work' },
  his_clones: { es: 'clones con oficio', en: 'clones with a craft' },
  his_tokens_det: { es: 'y contando, cada noche', en: 'and counting, every night' },

  // capítulo vivo: la línea de tiempo termina SIEMPRE en hoy, con cifras del día
  his_hoy_fecha: { es: 'hoy', en: 'today' },
  his_hoy_titulo: { es: 'El capítulo de hoy', en: "Today's chapter" },
  his_hoy_texto: {
    es: 'Lo que el clon es ahora mismo: {clones} clones con oficio, {rutinasok} de {rutinas} rutinas en verde y {tokens} tokens pensados en los últimos 30 días. Esta línea se vuelve a escribir sola con el refresco de cada noche.',
    en: 'What the clone is right now: {clones} clones with a craft, {rutinasok} of {rutinas} routines green and {tokens} tokens thought over the last 30 days. This line rewrites itself with every nightly refresh.'
  },
  his_ultimo: {
    es: 'último capítulo escrito el {fecha} · los capítulos se publican con el refresco nocturno',
    en: 'last chapter written on {fecha} · chapters publish with the nightly refresh'
  },
  his_pendiente: {
    es: 'la historia lleva {n} días sin capítulo nuevo',
    en: 'the story has gone {n} days without a new chapter'
  },
  his_sin_hitos: {
    es: 'Los capítulos llegan con el refresco nocturno y este lote no los trae. Las cifras de arriba siguen siendo las de hoy.',
    en: 'Chapters arrive with the nightly refresh and this batch does not carry them. The figures above are still today’s.'
  },

  // récords del sistema (máximos reales de la serie)
  rec_titulo: { es: 'Récords del sistema', en: 'System records' },
  rec_sub: {
    es: 'los techos medidos de la serie, con su fecha — se superan solos la próxima vez que el clon bata su marca',
    en: 'the measured highs of the series, with their dates — they beat themselves next time the clone breaks its record'
  },
  rec_tokens: { es: 'el día que más pensó', en: 'the day it thought the most' },
  rec_tareas: { es: 'el día que más terminó', en: 'the day it finished the most' },
  rec_llamadas: { es: 'el día con más llamadas', en: 'the day with the most calls' },

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

  useEffect(() => {
    const title = STR.document_title[lang]

    const syncDocument = () => {
      document.documentElement.lang = lang
      if (document.title !== title) document.title = title
    }

    const observer = new MutationObserver(syncDocument)

    syncDocument()
    observer.observe(document.head, { childList: true, subtree: true, characterData: true })

    return () => observer.disconnect()
  }, [lang])

  const setLang = (l: Lang) => {
    setLangState(l)
    window.localStorage.setItem('madclon-lang', l)
  }

  const t = (k: StrKey): string => STR[k]?.[lang] ?? STR[k]?.es ?? k

  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>
}

export const useLang = () => useContext(Ctx)
