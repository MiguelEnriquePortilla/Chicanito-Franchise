#!/usr/bin/env python3
"""
Genera el Memorándum de Inversión de Chicken Chicanito, personalizado por prospecto.

  python3 generar.py --nombre "Grupo Ejemplo" --clave CDMX
  python3 generar.py --nombre "Ana Ruiz" --clave GDL --fecha "Septiembre de 2026"

Produce un PDF con: marcadores navegables, índice clicable con números de página
automáticos, QR a capital.chicanito.app con la clave del prospecto, enlaces
profundos al simulador, correo con asunto precargado y pie personalizado.
"""
import argparse, re, unicodedata, pathlib, sys

BASE = pathlib.Path(__file__).parent
SITIO = "https://capital.chicanito.app"
CORREO = "infochicanito@gmail.com"

SECCIONES = [
    ("s01", "01", "Resumen ejecutivo"),
    ("s02", "02", "El problema y el modelo"),
    ("s03", "03", "La evidencia"),
    ("s04", "04", "Cómo se reparte el dinero"),
    ("s05", "05", "Los números"),
    ("s06", "06", "Qué aporta cada parte"),
    ("s07", "07", "Estructura y control"),
    ("s08", "08", "Qué puede salir mal"),
    ("s09", "09", "Los siguientes pasos"),
]


def slug(t):
    t = unicodedata.normalize("NFKD", t).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-zA-Z0-9]+", "-", t).strip("-").lower()


def qr(datos, destino, color="#17213E"):
    import qrcode
    q = qrcode.QRCode(version=None, error_correction=qrcode.constants.ERROR_CORRECT_M,
                      box_size=18, border=1)
    q.add_data(datos)
    q.make(fit=True)
    q.make_image(fill_color=color, back_color="white").save(destino)


def construir(nombre, clave, fecha):
    url_clave = f"{SITIO}/?clave={clave}"
    url_sim = f"{SITIO}/guia.html?clave={clave}"
    asunto = f"Tienda Insignia CDMX — {nombre}".replace(" ", "%20").replace("—", "%E2%80%94")
    mailto = f"mailto:{CORREO}?subject={asunto}"

    (BASE / "img").mkdir(exist_ok=True)
    qr(url_clave, BASE / "img/qr-navy.png", "#17213E")
    qr(url_clave, BASE / "img/qr-red.png", "#E30613")

    h = (BASE / "memo.html").read_text(encoding="utf-8")
    c = (BASE / "estilo.css").read_text(encoding="utf-8")

    # ---------- CSS: pie personalizado, marcadores, índice, QR ----------
    c = c.replace(
        'content:"Chicken Chicanito · Memorándum de inversión";',
        f'content:"Preparado para {nombre} · Confidencial";')
    c += """
/* ---------- Marcadores del panel lateral del lector ----------
   WeasyPrint marca h1-h6 por defecto; se suprimen y se marca el eyebrow,
   que ya contiene exactamente "NN · Título de la sección". */
h1,h2,h3,h4,h5,h6{ bookmark-level:none; }
.seccion .eyebrow{ bookmark-level:1; bookmark-label:content(text); }
.portada{ bookmark-level:1; bookmark-label:"Portada"; }
.indice { bookmark-level:1; bookmark-label:"Índice"; }
.cierre { bookmark-level:1; bookmark-label:"Contacto"; }

/* ---------- Índice ---------- */
.indice{ break-before:page; }
.toc{ margin-top:6mm; }
.toc a{
  display:block; position:relative; text-decoration:none; color:var(--navy);
  padding:3.2mm 12mm 3.2mm 10mm; border-bottom:.3mm solid var(--line);
  font-size:9.6pt; font-weight:400;
}
.toc a .n{
  position:absolute; left:0; top:2.9mm;
  font-family:'Bebas Neue'; font-size:12pt; color:var(--red); letter-spacing:.03em;
}
/* attr() se resuelve sobre el elemento que lo declara: debe vivir en el <a>. */
.toc a::after{
  content: target-counter(attr(href), page);
  position:absolute; right:0; top:2.7mm;
  font-family:'Bebas Neue'; font-size:12pt; color:var(--gold-dark);
}
.indice-nota{
  margin-top:8mm; background:var(--cream-deep); border-left:1.4mm solid var(--gold);
  padding:4mm 4.5mm; border-radius:0 2mm 2mm 0; font-size:8.4pt; line-height:1.58;
}

/* ---------- QR ---------- */
.qr-bloque{
  display:flex; gap:4mm; align-items:center; background:rgba(255,247,236,.10);
  border:.35mm solid rgba(255,247,236,.28); border-radius:2.5mm; padding:3.5mm 4mm;
  margin-top:7mm; width:88mm;
}
.qr-bloque img{ width:20mm; height:20mm; border-radius:1.2mm; background:#fff; padding:1mm; }
.qr-txt .l{ font-size:6.4pt; letter-spacing:.14em; text-transform:uppercase; color:var(--gold); }
.qr-txt .v{ font-family:'Bebas Neue'; font-size:13pt; color:var(--cream); line-height:1.2; }
.qr-txt .c{ font-size:7.4pt; color:#a9b3c7; margin-top:.8mm; }
.qr-txt .c b{ color:var(--cream); font-weight:600; letter-spacing:.06em; }

.c-qr{ width:29mm; height:29mm; background:#fff; padding:2mm; border-radius:2.5mm; margin:0 auto 5mm; }
.c-qr-l{ font-size:7pt; color:#ffe0e2; letter-spacing:.1em; text-transform:uppercase; margin:5mm 0 3mm; }

/* ---------- Enlaces al simulador dentro del documento ---------- */
.ir{
  display:block; text-decoration:none; background:var(--cream-deep);
  border:.35mm solid var(--gold); border-radius:2mm; padding:3mm 4mm; margin:4mm 0;
  font-size:8.4pt; color:var(--navy);
}
.ir{ break-inside:avoid; }
.ir b{ color:var(--red); font-weight:600; }
.ir .u{ display:block; font-size:7pt; color:var(--gold-dark); margin-top:.8mm; letter-spacing:.03em; }
a{ text-decoration:none; color:inherit; }
.c-mail a{ color:#fff; text-decoration:underline; }
"""

    # ---------- Anclas + marcadores por sección ----------
    for sid, num, titulo in SECCIONES:
        marca = f'<div class="eyebrow">{num} · '
        assert h.count(marca) == 1, f"ancla ambigua para {num}"
        h = h.replace(marca, f'<div class="eyebrow" id="{sid}">{num} · ')

    # ---------- Página de índice ----------
    filas = "\n".join(
        f'      <a href="#{sid}"><span class="n">{num}</span>'
        f'<span class="t">{titulo}</span><span class="p"></span></a>'
        for sid, num, titulo in SECCIONES)
    indice = f"""
<div class="indice">
  <div class="eyebrow">Contenido</div>
  <h1>Qué hay en este documento.</h1>
  <div class="toc">
{filas}
  </div>
  <div class="indice-nota">
    <strong>Este documento es el complemento impreso del simulador en línea.</strong>
    Aquí están los números con los supuestos que proponemos. En
    <strong>capital.chicanito.app</strong> puede mover cada variable y ver el
    resultado recalculado al instante, con su clave de acceso
    <strong>{clave}</strong>.
  </div>
</div>
"""
    marca_fin_portada = "</div>\n</div>\n\n<!-- ============ 01 RESUMEN ============ -->"
    assert h.count(marca_fin_portada) == 1
    h = h.replace(marca_fin_portada, "</div>\n</div>\n" + indice + "\n<!-- ============ 01 RESUMEN ============ -->")

    # ---------- QR en portada ----------
    bloque_qr = f"""      <div class="qr-bloque">
        <img src="img/qr-navy.png">
        <div class="qr-txt">
          <div class="l">Simulador interactivo</div>
          <div class="v">capital.chicanito.app</div>
          <div class="c">Clave de acceso: <b>{clave}</b></div>
        </div>
      </div>
"""
    marca = '    <div class="p-pie">'
    assert h.count(marca) == 1
    h = h.replace(marca, bloque_qr + marca)

    # ---------- Enlaces profundos al simulador ----------
    enlaces = [
        ("""  <div class="destacado">
    <strong>El socio recibe más que el operador, en pesos.</strong> Es intencional. Es quien puso el capital y quien corre el riesgo.
  </div>""",
         """  <div class="destacado">
    <strong>El socio recibe más que el operador, en pesos.</strong> Es intencional. Es quien puso el capital y quien corre el riesgo.
  </div>
  <a class="ir" href="{sim}"><b>¿No le convencen estos supuestos?</b> Muévalos usted mismo: el simulador recalcula la cascada completa al instante.<span class="u">{sim_txt} · clave {clave}</span></a>"""),
        ("""  <p>Si la Tienda Insignia no genera utilidad, no hay distribución. Para nadie. Las distribuciones se calculan mensualmente y se pagan dentro de los primeros diez días del mes siguiente, previa reserva del capital de trabajo acordado.</p>""",
         """  <p>Si la Tienda Insignia no genera utilidad, no hay distribución. Para nadie. Las distribuciones se calculan mensualmente y se pagan dentro de los primeros diez días del mes siguiente, previa reserva del capital de trabajo acordado.</p>
  <a class="ir" href="{sim}"><b>Vea la cascada mes a mes.</b> El simulador dibuja los tres escalones sobre los sesenta meses del proyecto.<span class="u">{sim_txt} · clave {clave}</span></a>"""),
    ]
    for viejo, nuevo in enlaces:
        assert h.count(viejo) == 1, "enlace profundo no encontrado"
        h = h.replace(viejo, nuevo.format(sim=url_sim, sim_txt=url_sim.replace("https://", ""), clave=clave))

    # ---------- Contraportada: QR, correo y enlace ----------
    h = h.replace(
        """    <div class="c-cta">
      <div class="l">Documento interactivo</div>
      <div class="v">capital.chicanito.app</div>
    </div>""",
        f"""    <div class="c-qr-l">Escanee para abrir el simulador</div>
    <img class="c-qr" src="img/qr-red.png">
    <a class="c-cta" href="{url_clave}">
      <div class="l">Su clave de acceso: {clave}</div>
      <div class="v">capital.chicanito.app</div>
    </a>""")
    h = h.replace(
        f'Miguel Enrique Portilla · <strong>{CORREO}</strong>',
        f'Miguel Enrique Portilla · <a href="{mailto}">'
        f'<img class="c-mail-ico" src="img/icono-correo.png"><strong>{CORREO}</strong></a>')

    # ---------- Personalización de portada ----------
    h = h.replace("Agosto de 2026 · Documento complementario a capital.chicanito.app",
                  f"{fecha} · Preparado para <b>{nombre}</b>")
    h = h.replace("Fecha: [_____] de 2026", f"{fecha}")

    return h, c


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--nombre", required=True, help="Nombre del prospecto o grupo")
    p.add_argument("--clave", required=True, help="Clave de acceso del prospecto (ej. CDMX)")
    p.add_argument("--fecha", default="Agosto de 2026")
    p.add_argument("--salida", default=None)
    a = p.parse_args()

    h, c = construir(a.nombre, a.clave.upper(), a.fecha)
    (BASE / "_build.html").write_text(h, encoding="utf-8")
    (BASE / "_build.css").write_text(c, encoding="utf-8")
    (BASE / "_build.html").write_text(h.replace('href="estilo.css"', 'href="_build.css"'), encoding="utf-8")

    salida = a.salida or f"/mnt/user-data/outputs/Chicanito-Memorandum-{slug(a.nombre)}.pdf"
    from weasyprint import HTML
    from pypdf import PdfReader, PdfWriter
    HTML(str(BASE / "_build.html")).write_pdf(str(BASE / "_tmp.pdf"))

    # clone_from preserva marcadores y destinos; add_page() los descarta.
    w = PdfWriter(clone_from=str(BASE / "_tmp.pdf"))
    w.add_metadata({
        "/Title": f"Chicken Chicanito — Memorándum de Inversión · Tienda Insignia CDMX",
        "/Author": "Miguel Enrique Portilla — Chicken Chicanito",
        "/Subject": f"Sociedad de capital para la Tienda Insignia de CDMX. Preparado para {a.nombre}.",
        "/Keywords": f"Chicken Chicanito, inversión, sociedad de capital, CDMX, confidencial, {a.clave.upper()}",
        "/Creator": "Chicken Chicanito",
    })
    with open(salida, "wb") as f:
        w.write(f)
    print(f"OK  {salida}  ({len(PdfReader(salida).pages)} páginas)")


if __name__ == "__main__":
    main()

