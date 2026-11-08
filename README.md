# Cine Capri: demo de la web nueva

Demo para enseñar a Cine Capri (El Prat de Llobregat). Es una web pública y un panel de administración, hechos con HTML, CSS y JavaScript sin dependencias.

## Cómo abrirla

```bash
cd demo
python3 -m http.server 8765
```

- Web: http://localhost:8765/
- Historia: http://localhost:8765/historia.html (página propia, como en la web antigua)
- Panel: http://localhost:8765/admin.html (contraseña de la demo: `capri`)

Para enseñarla en el móvil, súbela tal cual a Netlify Drop (arrastrar la carpeta `demo`), Vercel o GitHub Pages.

Truco para la presentación: añade `?avui=2026-11-14&hora=18:00` a la URL para que la web se comporte como si fuera ese día y esa hora.

Orden de la cartelera: primero va la película cuya próxima sesión (día y hora) está más cerca. Las sesiones de hoy que ya han empezado salen tachadas; cuando a una película no le queda ninguna sesión hoy, ese día desaparece, y si no tiene más días, la película desaparece.

## Qué es real y qué es de ejemplo

| Dato | Estado |
|---|---|
| Títulos y fechas de la cartelera | Reales, sacados de su web (noviembre-diciembre 2026) |
| Cine Club «Bird», 18 nov. 19:30 | Real |
| Dirección, teléfono, redes, historia | Reales |
| Horas de las sesiones | Basadas en su horario real (17:00 y 20:00, según el cartel de «Ruega por nosotras» de su web). Las de «Ruega por nosotras» y «Bird» son reales; las demás siguen ese patrón, pero hay que confirmarlas |
| **Precios** | **Inventados** |
| «La taquilla abre media hora antes» | **Supuesto**: hay que confirmarlo |
| Sinopsis | Escritas a mano, cortas; «Hechizo» aún no tiene |
| Logo y fotos de la historia | De su web actual. El logo solo existe a 60×240 px: hay que pedirles el original |
| Carteles y duraciones | Oficiales, de TMDB (themoviedb.org), guardados en `img/` |

## Panel de administración

- Añadir o editar películas: título, tipo (película o Cine Club), edad, duración, «para toda la familia», sinopsis, tráiler y cartel.
- Días y horas: un día por línea. Las horas se escriben como quieras («17:00», «17.00», «17h»). El botón «Repeteix l'últim dia l'endemà» copia el último día al día siguiente.
- «Encara no tenim data»: la película sale en «Pendents de confirmar».
- Las sesiones pasadas desaparecen solas de la web.
- Información y precios: aviso arriba de la web (vacaciones, cierres), precios, teléfono, redes.
- Relleno automático: con una clave gratuita de https://www.themoviedb.org/settings/api, al buscar el título se rellenan solos el cartel, la sinopsis, la duración, la edad y el tráiler.

## Enlaces de la web antigua

En «Parlen de nosaltres» de la web actual, el enlace del ACIP (40.º aniversario) redirige ahora a una web de videochat para adultos. No está en la web nueva, y conviene avisar al cine para que lo quite de la actual.

## Carteles

Las películas que se añaden desde el panel sin clave de TMDB salen con un cartel de color y su título, hasta que se sube una foto del cartel. En la versión pública conviene poner en el pie «Datos e imágenes de TMDB», como piden sus condiciones de uso.

## Limitaciones de la demo

- Los datos se guardan en el navegador (localStorage). Lo que se cambia en un ordenador no se ve en otro.
- La contraseña está en el propio código. Solo sirve para la demo.

En la versión definitiva, los datos van a una base de datos (por ejemplo Supabase), con usuarios de verdad para el cine, y los cambios se ven al momento en todos los dispositivos.

## Colores

- Color principal: el de las butacas del cine, `rgba(127, 17, 70, 1)` / `#7f1146`.
- Fondo color papel, tinta oscura. Tipografías: Zilla Slab (títulos) y Source Sans 3 (texto).
