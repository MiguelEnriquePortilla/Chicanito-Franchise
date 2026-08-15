# Generador del Memorándum de Inversión

Produce el PDF personalizado por prospecto: QR con su clave, pie con su nombre,
marcadores navegables, índice clicable y enlaces al simulador.

## Uso

```bash
pip install weasyprint pypdf qrcode pillow
python3 generar.py --nombre "Grupo Ejemplo" --clave CDMX
python3 generar.py --nombre "Ana Ruiz" --clave GDL --fecha "Septiembre de 2026"
```

Requiere las tipografías de marca: **Bebas Neue** y **Poppins** instaladas en el sistema.

## Archivos

```
memo-pdf/
  generar.py            CLI que arma y escribe el PDF
  memo.html             contenido del documento
  estilo.css            tokens de marca, paginación, marcadores
  img/
    badge.png           logo circular recortado con transparencia
    slogan-navy.png     "Very Sabrosito!" para fondos claros
    slogan-cream.png    "Very Sabrosito!" para fondos oscuros
    mascota.png         mascota recortada (portada)
    wm-navy.png         marca de agua tileable sobre crema
    wm-cream.png        marca de agua tileable sobre navy/rojo
    movil.jpg           póster "Seis puntos de venta / Una sola renta"
    icono-correo.png    sobre en crema para la contraportada
  LEEME.md
```

`qr-navy.png` y `qr-red.png` se generan solos en cada corrida, con la clave del
prospecto. No se versionan.

## Qué genera

- Portada y contraportada con QR a `capital.chicanito.app/?clave=CLAVE`
- Pie de cada página: "Preparado para NOMBRE · Confidencial"
- 12 marcadores en el panel lateral del lector
- Índice con números de página calculados automáticamente
- Tres enlaces al simulador desde las páginas de números
- Correo con asunto precargado e icono de sobre
- Póster del modelo móvil en la sección 02, sin recortes

## Pendiente en el sitio (para Claude Code)

El QR apunta a `capital.chicanito.app/?clave=CDMX`. **Hoy el parámetro se ignora**
y el prospecto cae en la pantalla de captura de clave — funciona, pero teclea.

Para que el QR sea de un toque, en `index.html` / `js/acceso.js`:

1. Leer `?clave=` de `window.location.search` al cargar.
2. Si viene, precargar el campo y enviar la validación automáticamente.
3. Limpiar el parámetro de la URL con `history.replaceState` tras validar,
   para que la clave no quede en el historial ni se comparta por accidente.
4. Si la clave es inválida, mostrar la pantalla normal con el mensaje de error.

No hay que reimprimir nada: los QR ya emitidos empiezan a funcionar solos.

## Nota de mantenimiento

`estilo.css` evita tres limitaciones reales de WeasyPrint, ya documentadas
en el propio archivo. No revertirlas:

- `box-shadow` no está soportado → la sombra offset de marca se hace con bordes.
- `border-radius` mayor a la mitad de la altura dibuja un trazo auto-intersecado.
- Un `<a>` inline con hijos de bloque se parte en varias cajas: cada una repinta
  el borde y duplica la anotación de enlace. Por eso `.c-cta` es `display:block`.

Y en `generar.py`: `bookmark-label` debe declararse explícitamente
(`content(text)`), `target-counter(attr(href), page)` tiene que vivir en el propio
`<a>` (attr() se resuelve sobre el elemento que lo declara, no sobre un ancestro), y
el PDF final se escribe con `PdfWriter(clone_from=...)` porque `add_page()` descarta
los marcadores.

**El póster `img/movil.jpg` va íntegro, sin recortar.** Es una composición donde el
script "Very Sabrosito!" se encima con la marquesina y el logo del pie comparte
altura con la mascota: cualquier recorte parte algún elemento.
