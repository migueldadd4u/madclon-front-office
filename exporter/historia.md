# Historia pública del clon — fuente única de la línea de tiempo

Este fichero es la ÚNICA fuente de los hitos que se ven en `/historia`. El
exportador lo lee en cada refresco (`make data`) y lo publica dentro de
`overview.json`; la web ya no lleva ningún hito escrito en el código.

**Para añadir un capítulo**: copia un bloque, cámbialo y ya está. Sale publicado
en el refresco nocturno siguiente, sin tocar React ni desplegar a mano.

Reglas del contenido (es una web PÚBLICA):

- Nada de personas identificables, clientes, importes, rutas ni nombres internos.
- Nada de cifras a mano: las cifras vivas las pone la web desde los JSON.
- Un hito cuenta lo que pasó ESE día; no se reescribe después.
- `fuente:` es trazabilidad interna y NO se publica: queda en este fichero.

Formato de un bloque (el orden de las claves da igual, `fuente` es opcional):

```
### AAAA-MM-DD
icono: ri-<nombre>          ← clase Remix Icon (el bundle trae el set entero)
color: primary|success|info|warning|error|secondary
es_titulo: …
es_texto: …
en_titulo: …
en_texto: …
fuente: <bitácora o commit que lo respalda>   ← interno, no se publica
```

---

### 2026-04-14
icono: ri-seedling-line
color: success
es_titulo: Nace el proyecto
es_texto: Primeras notas de lo que será el segundo cerebro de MAD. Todo empieza como un experimento de memoria.
en_titulo: The project is born
en_texto: The first notes of what will become MAD's second brain. It all starts as a memory experiment.
fuente: handoff-v1_0-doc-readme-20260414.md

### 2026-04-16
icono: ri-team-line
color: primary
es_titulo: De un agente a varios
es_texto: El clon da el salto a multi-agente con memoria propia: ya no es un chatbot, es un equipo.
en_titulo: From one agent to many
en_texto: The clone leaps to multi-agent with its own memory: no longer a chatbot, but a team.
fuente: handoff-v1-nacimiento-v2-multi-agente-20260416.md

### 2026-04-19
icono: ri-heart-pulse-line
color: info
es_titulo: El motor Hermes arranca
es_texto: El corazón del sistema queda operativo: rutinas automáticas que laten solas, de día y de noche.
en_titulo: The Hermes engine starts
en_texto: The system's heart becomes operational: automatic routines beating on their own, day and night.
fuente: handoff-v2-cierre-fase-1-hermes-20260419.md

### 2026-04-22
icono: ri-safe-2-line
color: warning
es_titulo: Nace el clon Patrimonio
es_texto: El primer especialista con oficio: vigilar el patrimonio de la familia. La flota empieza a crecer.
en_titulo: The Assets clone is born
en_texto: The first specialist with a craft: watching over the family's assets. The fleet begins to grow.
fuente: bitácora del 22/04 (nacimiento del primer subclón)

### 2026-05-12
icono: ri-robot-2-line
color: primary
es_titulo: Ecosistema completo
es_texto: Siete bots orquestados trabajando en equipo y WhatsApp conectado como puerta de entrada.
en_titulo: Full ecosystem
en_texto: Seven orchestrated bots working as a team, with WhatsApp connected as an entry door.
fuente: bitácora del 12/05

### 2026-05-15
icono: ri-refresh-line
color: info
es_titulo: Cambio de motor en marcha
es_texto: Toda la flota migra de OpenClaw a Hermes sin perder un solo día de servicio.
en_titulo: Engine swap in motion
en_texto: The whole fleet migrates from OpenClaw to Hermes without losing a single day of service.
fuente: bitácora del 15/05

### 2026-05-24
icono: ri-mail-line
color: success
es_titulo: El correo entra en escena
es_texto: El clon empieza a leer y clasificar el correo, con reglas de privacidad desde el primer día.
en_titulo: Mail enters the scene
en_texto: The clone starts reading and sorting mail, with privacy rules from day one.
fuente: bitácora del 24/05

### 2026-06-02
icono: ri-mind-map
color: primary
es_titulo: El cerebro se interconecta
es_texto: Las notas de la memoria privada (el «vault») dejan de ser islas: todo queda enlazado y localizable en segundos.
en_titulo: The brain interconnects
en_texto: The private memory («vault») notes stop being islands: everything gets linked and findable in seconds.
fuente: handoff-v0_0-indice-historia-completa-20260603.md

### 2026-06-20
icono: ri-arrow-up-double-line
color: warning
es_titulo: Nace la automejora
es_texto: El clon empieza a proponer y aplicar mejoras sobre sí mismo. Cada noche, un poco mejor.
en_titulo: Self-improvement is born
en_texto: The clone starts proposing and applying improvements on itself. Every night, a little better.
fuente: handoff-v6_33-loop-tareas-reales-dedup-indice-20260620.md

### 2026-07-07
icono: ri-dashboard-3-line
color: info
es_titulo: La flota se organiza
es_texto: Panel de dirección para los subclones: cada uno con oficio, canales y responsabilidades claras.
en_titulo: The fleet gets organized
en_texto: A management panel for the subclones: each with a craft, channels and clear responsibilities.
fuente: handoff-dashboard-coo-subclones-20260707.md

### 2026-07-26
icono: ri-ruler-line
color: success
es_titulo: El clon se mide a sí mismo
es_texto: Se congela la línea base de eficiencia y nace este Front Office: los números del clon, abiertos.
en_titulo: The clone measures itself
en_texto: The efficiency baseline is frozen and this Front Office is born: the clone's numbers, in the open.
fuente: handoff-v6_53-medida-de-mejora-del-clon-linea-base-20260726.md

### 2026-07-28
icono: ri-shape-line
color: primary
es_titulo: Marca propia
es_texto: El Front Office estrena logotipo MAD Clon: la M constelación, cinco nodos trabajando como uno.
en_titulo: A brand of its own
en_texto: The Front Office unveils the MAD Clon logo: the constellation M, five nodes working as one.
fuente: handoff-v6_56-frontmatter-yaml-del-vault-20260728.md

### 2026-07-31
icono: ri-phone-line
color: info
es_titulo: El teléfono también entra
es_texto: Las llamadas recibidas y las perdidas pasan a ser una entrada más: lo que suena y nadie coge deja de perderse.
en_titulo: The phone comes in too
en_texto: Received and missed calls become just another inbox: what rings and goes unanswered stops getting lost.
fuente: handoff-v6_62-canal-llamadas-entrantes-20260731.md

### 2026-08-01
icono: ri-window-2-line
color: secondary
es_titulo: Sala de máquinas propia
es_texto: El clon estrena su panel privado de dirección: el sitio donde MAD ve en un vistazo lo que su equipo de IA está haciendo.
en_titulo: An engine room of its own
en_texto: The clone gets its private control panel: the place where MAD sees at a glance what his AI team is up to.
fuente: handoff-v6_65-panel-mad-construido-f0-f6-20260801.md

### 2026-08-02
icono: ri-contacts-book-3-line
color: success
es_titulo: La memoria de personas, al día
es_texto: Las cuatro colas de fichas pendientes llegan a cero: el clon recuerda a quién conoce sin acumular atrasos.
en_titulo: People memory, caught up
en_texto: The four queues of pending records reach zero: the clone remembers who it knows without piling up a backlog.
fuente: handoff-v6_66-memoria-de-personas-cuatro-colas-a-cero-y-capacidad-clonable-20260802.md

### 2026-08-03
icono: ri-global-line
color: primary
es_titulo: El clon sale a la calle
es_texto: Se publica una web abierta que se refresca sola varias veces al día, en veintiún idiomas. Lo que era un experimento privado ya tiene escaparate.
en_titulo: The clone goes public
en_texto: An open website goes live, refreshing itself several times a day, in twenty-one languages. What was a private experiment now has a shop window.
fuente: handoff-v6_68/69/70-loquedigalaia-*-20260803.md

### 2026-08-05
icono: ri-auction-line
color: warning
es_titulo: Nace el clon licitador
es_texto: Un especialista nuevo se pone a vigilar los concursos públicos y a puntuarlos cada mañana antes del desayuno.
en_titulo: The bidding clone is born
en_texto: A new specialist starts watching public tenders and scoring them every morning before breakfast.
fuente: handoff-v6_71-clon-licitador-nace-el-radar-de-licitaciones-20260805.md

### 2026-08-10
icono: ri-alarm-warning-line
color: error
es_titulo: El día que la web se quedó quieta
es_texto: El refresco nocturno dejó de llegar y esta web estuvo un día entera enseñando cifras viejas sin avisar. Se reparó el mismo día, y la lección quedó escrita: nada puede morir en silencio.
en_titulo: The day the site stood still
en_texto: The nightly refresh stopped arriving and this site spent a full day showing old figures without saying so. It was fixed the same day, and the lesson was written down: nothing may die in silence.
fuente: .gauntlet/BITACORA.md (ronda frescura) + commit 1d8d589

### 2026-08-12
icono: ri-book-open-line
color: success
es_titulo: La historia se cuenta sola
es_texto: Esta línea de tiempo deja de estar escrita a mano dentro de la web: los capítulos y las cifras salen del refresco nocturno, y si un capítulo se retrasa la propia página lo dice.
en_titulo: The story tells itself
en_texto: This timeline stops being hand-written inside the site: chapters and figures now come from the nightly refresh, and if a chapter runs late the page says so itself.
fuente: .gauntlet/BITACORA.md (ronda R7 — la historia se cuenta sola)
