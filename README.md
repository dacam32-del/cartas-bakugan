# Colección de Cartas Bakugan de David

Catálogo de mis cartas coleccionables de **Bakugan** (Gate, Ability, Character y Evo), con serie, set, atributo, rareza, idioma, año, estado y precio aproximado en pesos chilenos (CLP).

**Ver la página:** https://dacam32-del.github.io/cartas-bakugan/

## 🛒 Tienda web
**[https://dacam32-del.github.io/cartas-bakugan/](https://dacam32-del.github.io/cartas-bakugan/)**

## Qué tiene la página
- Búsqueda por nombre, serie, set, atributo, tipo o notas (sin importar tildes).
- Filtros por **serie o set** (Battle Brawlers, New Vestroia, Gundalian Invaders, Mechtanium Surge, Battle Planet, Armored Alliance, Geogan Rising, Evolutions, Legends), **atributo o elemento** (Pyrus, Aquos, Ventus, Subterra, Haos, Darkus, Aurelus), **tipo de carta** (Ability, Gate, Character, Evo, Normal, Command), **rareza**, **idioma** y **año**.
- Orden por defecto: **precio de mayor a menor** (también menor a mayor, año, nombre o serie/set).
- Totales de cartas en stock, valor de mercado y valor sugerido en CLP.
- Calculadora / carrito flotante: botón **Agregar** en cada ficha, cambiar cantidades, quitar, vaciar y total en CLP, guardado en el navegador (`localStorage`).
- Música de fondo de estilo batalla: “Danger Storm” de Kevin MacLeod ([incompetech.com](https://incompetech.com)), licencia [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Se enciende y apaga con el botón de la esquina.
- Encabezado con el logo **슈팅 바쿠간 BAKUGAN** (recorte aparte del reverso de las cartas; las fotos de cada ficha se publican 100 % intactas).
- Paleta visual inspirada en el reverso clásico de Yu-Gi-Oh!: marrón, bronce, dorado y oscuro.
- Consulta por WhatsApp en el encabezado y en cada carta.

## Archivos
| Archivo | Para qué |
|---|---|
| `cartas.json` | **Única fuente de datos**: cada carta es un objeto dentro de `"cartas"`. Empieza vacío, listo para agregar. |
| `index.html`, `style.css`, `app.js` | La página (estática, lee `cartas.json`). |
| `img/` | Fotos de las cartas, copiadas **tal cual** (byte a byte, sin comprimir ni recortar). |
| `audio/musica.mp3` | Música de fondo (CC BY 4.0). |
| `agregar_carta.py` | Agrega o quita cartas y copia las fotos verificando el hash SHA-256. |
| `publicar.sh` | Hace commit y push a `main` (GitHub Pages se actualiza solo). |

## Cómo agregar una carta
Las fotos se copian **100 % intactas**, byte a byte (`cp` + `sha256sum`). No se recortan, no se redimensionan y no se recomprimen.

```bash
python3 agregar_carta.py \
  --nombre "Dragonoid" \
  --serie "Battle Brawlers" \
  --tipo Character \
  --atributo Pyrus \
  --rareza Rare \
  --idioma Español \
  --anio 2009 \
  --estado NM \
  --precio-min 3000 --precio-max 6000 \
  --fotos foto-frente.jpg foto-reverso.jpg

python3 agregar_carta.py --listar
python3 agregar_carta.py --quitar BGN-001
./publicar.sh "Agregar Dragonoid BGN-001"
```

También se puede editar `cartas.json` a mano y copiar las fotos a `img/` con `cp`, comprobando que el SHA-256 del original y el de `img/` coincidan. Después: commit y push a `main`. GitHub Pages actualiza la página en uno o dos minutos.

Campos de cada carta: `id`, `codigo` (BGN-001, …), `nombre`, `nombre_en`, `serie`, `set`, `codigo_set`, `numero`, `anio`, `tipo` (Ability / Gate / Character / Evo / Normal / Command), `atributo` (Pyrus / Aquos / Ventus / Subterra / Haos / Darkus / Aurelus), `rareza`, `idioma`, `estado`, `cantidad`, `efecto`, `precio_mercado_usd`, `precio_mercado_clp`, `precio_sugerido_clp`, `precio_min_clp`, `precio_max_clp`, `dolar_clp`, `fuente`, `fecha_precio`, `fecha_alta`, `nota`, `imagen`, `imagenes`.

## Precios
Referencias en CLP: primero ventas realizadas en Chile, luego anuncios activos en Chile; referencias internacionales (USD × dólar del día) solo si no hay nacionales. Se distingue vendido, pedido (anuncio) y estimación. El valor real depende del estado de cada carta.

Bakugan © Spin Master / Sega Toys / TMS Entertainment. Sitio de colección personal, sin afiliación oficial.

## Contacto
WhatsApp: +56 9 5659 2453
