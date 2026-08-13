# Oficios públicos de la flota — fuente única de lo que dice cada tarjeta

Este fichero es la ÚNICA fuente del **rol** y la **misión** que se ven en
`/flota` y en la capa 2 de cada clon. El exportador lo lee en cada refresco
(`make data`) y lo publica dentro de `clones.json`.

**Por qué existe.** Hasta el 13/08/2026 esas dos líneas se copiaban tal cual de
las vistas privadas del vault (`Vistas-Principales/subclones/*.md`, campo
`**Misión:**`, y la tabla de `SISTEMA-COMPLETO.md`). Eso puso en una web pública
e indexada el nombre de una operación patrimonial viva, los nombres de las
empresas de MAD y media docena de tecnicismos sin traducir — porque el escáner
de privacidad audita el CÓDIGO, no los DATOS, y las reglas de copy tampoco
llegan a un JSON. Ahora el vault se queda dentro y aquí se escribe la versión
pública, a mano y en los dos idiomas.

Reglas del contenido (es una web PÚBLICA):

- Nada de personas identificables, clientes, importes, rutas ni nombres
  internos: ni operaciones, ni empresas, ni cargos, ni nombres de máquinas o
  programas del sistema.
- Nada de tecnicismos sin traducir (`REGLAS-COPY.md` §2). Se dice «la puerta por
  la que piensa», no «gateway»; «la memoria privada», no «vault».
- Nada de cifras: las cifras vivas las pone la web desde los JSON.
- Los dos idiomas son obligatorios. Un perfil sin `en_*` no se publica: la
  tarjeta se queda sin texto y el refresco deja aviso en `manifest.json`.
- Fiel a lo que el clon hace de verdad. Esto no es escaparate: si un oficio
  cambia en el vault, se cambia también aquí.

Formato de un bloque (el orden de las claves da igual, `fuente` es opcional y
NO se publica):

```
### <perfil>                ← el mismo identificador que usa clones.json
es_rol: …                   ← dos o tres palabras, es el subtítulo de la tarjeta
en_rol: …
es_mision: …                ← una o dos frases, lenguaje llano
en_mision: …
fuente: <vista privada que respalda el texto>
```

---

### clon
es_rol: Coordinador del equipo
en_rol: Team coordinator
es_mision: Dirige al resto: comprueba que todo esté en pie, reparte cada asunto al clon que le toca y decide qué es lo primero de todo lo que entra en la bandeja única.
en_mision: Runs the rest of the team: checks that everything is up, routes each matter to the clone it belongs to, and decides what comes first among everything arriving in the single inbox.
fuente: Vistas-Principales/subclones/Clon-COO.md

### ceo
es_rol: La mirada larga
en_rol: The long view
es_mision: Sostiene lo que no urge hoy pero decide el rumbo: las decisiones grandes y las relaciones que hay que cuidar antes de necesitarlas.
en_mision: Holds what is not urgent today but sets the course: the big decisions, and the relationships worth tending before you need them.
fuente: Vistas-Principales/subclones/CEO.md

### patrimonio
es_rol: Patrimonio de la familia
en_rol: Family assets
es_mision: Cuida lo que la familia tiene: ahorro, inmuebles, impuestos y el trato con los bancos. Avisa antes de que venza un plazo, no después.
en_mision: Looks after what the family owns: savings, property, taxes and dealings with the banks. It warns before a deadline expires, not after.
fuente: Vistas-Principales/subclones/Patrimonio.md

### padre
es_rol: La vida de casa
en_rol: Life at home
es_mision: Protege la esfera personal: la familia, la salud, el colegio, las vacaciones y el tiempo libre. Es el único clon al que no se le pide productividad.
en_mision: Protects the personal sphere: family, health, school, holidays and free time. It is the one clone never asked to be productive.
fuente: Vistas-Principales/subclones/Padre.md

### licitador
es_rol: Concursos públicos
en_rol: Public tenders
es_mision: Repasa cada mañana los concursos que publican las administraciones, los puntúa uno a uno y deja preparadas las propuestas técnicas que merecen la pena.
en_mision: Goes through the tenders published by public bodies every morning, scores them one by one, and drafts the technical proposals worth writing.
fuente: Vistas-Principales/subclones/Licitador.md

### tecnico
es_rol: La sala de máquinas
en_rol: The engine room
es_mision: Mantiene y audita la maquinaria del propio clon: el motor que late cada noche, las conexiones con el correo y las agendas, y las instrucciones con las que piensa.
en_mision: Maintains and audits the clone's own machinery: the engine that beats every night, the links to mail and calendars, and the instructions it thinks with.
fuente: Vistas-Principales/subclones/Tecnico.md

### ideas
es_rol: Lo que aún no existe
en_rol: What does not exist yet
es_mision: Incubadora sin reglas: el sitio donde se prueba una idea antes de que tenga nombre, y de donde salen los proyectos que después se toman en serio.
en_mision: An incubator with no rules: where an idea gets tried before it has a name, and where the projects later taken seriously come from.
fuente: Vistas-Principales/subclones/Ideas.md
