# Conexiones públicas — cómo se llaman fuera los buzones y las agendas

Este fichero es la ÚNICA fuente de los nombres que se ven en `/salud` y en las
«conexiones en vivo» de la capa 2 de cada clon. El exportador lo lee en cada
refresco (`make data`) y publica estos nombres en `clones.json`.

**Por qué existe.** Hasta el 13/08/2026 se publicaba la etiqueta del vault tal
cual, y esas etiquetas llevan dentro el nombre de las organizaciones de MAD —
contra la regla 1 de `REGLAS-COPY.md` («ni cargo, ni empresa»). Es el mismo
defecto que tenían las misiones de la flota, en otra columna: texto privado
viajando en un JSON de datos, por donde no pasa ni `public-safety` ni
`check-copy`, que auditan el código.

**Por qué las claves son ilegibles.** Este repositorio es PÚBLICO. Si la fuente
curada estuviera indexada por la etiqueta del vault, la etiqueta quedaría
publicada aquí en vez de en la web — el mismo problema, movido de sitio. Así que
la clave es un derivado corto y estable de la etiqueta, y la etiqueta no aparece
en ningún fichero de este repositorio.

No es un secreto criptográfico: es un derivado de una cadena corta y quien
adivine el formato puede confirmar su conjetura. Lo que garantiza es que aquí no
se **publica** nada, que es de lo que iba la regla.

**Para ver o rehacer el mapa** (solo en el Mac de MAD, contra el vault real):

```
python3 exporter/export_panel.py --claves-conexiones
```

Imprime `clave ← etiqueta` de todo lo que el vault trae hoy. Esa salida NO se
pega aquí ni en un commit.

**Si renombras una conexión en el vault**, su clave cambia y deja de encontrar
bloque: la fila sale sin nombre, el refresco deja aviso en `manifest.json` y
`check-contrato` falla. Nunca se cae de vuelta a la etiqueta privada. Para
arreglarlo: saca la clave nueva con el comando de arriba y cámbiala aquí.

Reglas del contenido: las mismas que `misiones.md`. Nada de organizaciones,
personas ni cargos. El proveedor (M365, Gmail, iCloud, Google) sí se puede
nombrar: es tecnología genérica y ayuda a entender que son buzones y agendas de
verdad, de sitios distintos.

Formato de un bloque:

```
### <clave>
es_nombre: …
en_nombre: …
```

---

### 2a5e3926
es_nombre: Correo de trabajo (M365)
en_nombre: Work mail (M365)

### 2c435866
es_nombre: Correo de la asociación (Gmail)
en_nombre: Association mail (Gmail)

### 132b93b4
es_nombre: Correo de patrimonio (Gmail)
en_nombre: Assets mail (Gmail)

### aefcdbb3
es_nombre: Correo personal (iCloud)
en_nombre: Personal mail (iCloud)

### 6b996a58
es_nombre: Agenda de trabajo (M365)
en_nombre: Work calendar (M365)

### 4f1bcdaf
es_nombre: Agenda de la asociación (Google)
en_nombre: Association calendar (Google)

### c75c1d4b
es_nombre: Agenda de familia (iCloud)
en_nombre: Family calendar (iCloud)
