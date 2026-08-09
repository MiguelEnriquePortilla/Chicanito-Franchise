// GET /api/guia — devuelve el HTML de los 12 bloques SOLO si la sesión es
// válida. Sin sesión válida, no sale ni un byte del copy (401, sin cuerpo con
// contenido). El shell público (guia.html) no trae el contenido embebido: lo
// pide aquí después de que el navegador ya trae la cookie de sesión.
const { readSession } = require('../lib/session');
const { getSql, ensureTables, codeIsActive } = require('../lib/db');

const VENTA_POR_HORA = [
  { hora: 9, semana: 383, finde: 748 },
  { hora: 10, semana: 1321, finde: 1791 },
  { hora: 11, semana: 2189, finde: 2863 },
  { hora: 12, semana: 2704, finde: 3535 },
  { hora: 13, semana: 3803, finde: 4873 },
  { hora: 14, semana: 4761, finde: 5507 },
  { hora: 15, semana: 5213, finde: 5840 },
  { hora: 16, semana: 3869, finde: 4674 },
  { hora: 17, semana: 2424, finde: 2844 },
  { hora: 18, semana: 954, finde: 891 },
  { hora: 19, semana: 43, finde: 140 },
];

function barritasHora() {
  const max = Math.max(...VENTA_POR_HORA.map((h) => h.finde));
  return VENTA_POR_HORA.map((h) => {
    const destacada = h.hora >= 13 && h.hora <= 16;
    const pctSemana = Math.round((h.semana / max) * 100);
    const pctFinde = Math.round((h.finde / max) * 100);
    return `
      <div class="hora-col${destacada ? ' hora-col--pico' : ''}">
        <div class="hora-barras">
          <div class="hora-barra hora-barra--semana" style="height:${pctSemana}%" title="Entre semana: $${h.semana.toLocaleString('es-MX')}"></div>
          <div class="hora-barra hora-barra--finde" style="height:${pctFinde}%" title="Fin de semana: $${h.finde.toLocaleString('es-MX')}"></div>
        </div>
        <div class="hora-label">${h.hora}h</div>
      </div>`;
  }).join('');
}

function html() {
  return `
<section class="bloque bloque--portada" id="bloque-01">
  <p class="eyebrow">Chicken Chicanito · Modelo de franquicia CEDIS</p>
  <h1 class="titular">Una sucursal. Seis puntos de venta.</h1>
  <p class="bajada">Chicken Chicanito vende $9.8 millones al año en un local sin una sola mesa. Todo se lo llevan. Ahora vamos a llevárselo nosotros.</p>
  <p class="pie-portada">Primera unidad: Ciudad de México · Licencia disponible</p>
</section>

<section class="bloque" id="bloque-02">
  <p class="eyebrow">02 · El problema</p>
  <h2>Una rosticería es un negocio atado a un metro cuadrado.</h2>
  <p>Rentas todo el día. Pagas nómina todo el día. Compras equipo que sirve todo el día.</p>
  <p>Y vendes tres horas.</p>
  <p>En Jojutla lo medimos: <strong>el 63% de la venta ocurre entre la una y las cuatro de la tarde.</strong> A las nueve de la mañana el local factura menos de cuatrocientos pesos. Después de las cinco, se apaga.</p>
  <p>El equipo está pagado. La renta está pagada. La gente está ahí.</p>
  <p>El problema nunca fue la demanda. Fue que el negocio no se puede mover.</p>
  <div class="grafica-horas" role="img" aria-label="Venta promedio por hora en Jojutla, últimos 90 días. La franja de 13 a 16 horas concentra el 63% de la venta del día.">
    ${barritasHora()}
  </div>
  <div class="grafica-horas-leyenda">
    <span><i class="dot dot--semana"></i> Entre semana</span>
    <span><i class="dot dot--finde"></i> Fin de semana</span>
    <span class="grafica-horas-nota">13–16h = 63% de la venta del día</span>
  </div>
</section>

<section class="bloque" id="bloque-03">
  <p class="eyebrow">03 · El modelo</p>
  <h2>Que la sucursal deje de esperar al cliente.</h2>
  <p><strong>Chicanito CEDIS</strong> es una sucursal que además funciona como centro de distribución de cinco Chicanito Móvil, los puntos de venta rodantes de la marca.</p>
  <p>Cada mañana a las nueve —la hora muerta— los Chicanito Móvil cargan producto y salen. Escuelas, empresas, parques industriales, los puntos donde la gente ya está. Regresan al cierre.</p>
  <p>La sucursal vende en su esquina. Los Chicanito Móvil venden en cinco esquinas más.</p>
  <p class="destacado">Misma renta. Mismo equipo. Misma nómina base. Seis puntos de venta.</p>
  <div class="diagrama-cedis">
    <div class="diagrama-nodo diagrama-nodo--centro">Sucursal CEDIS</div>
    <div class="diagrama-radios">
      <div class="diagrama-nodo">Chicanito Móvil 1</div>
      <div class="diagrama-nodo">Chicanito Móvil 2</div>
      <div class="diagrama-nodo">Chicanito Móvil 3</div>
      <div class="diagrama-nodo">Chicanito Móvil 4</div>
      <div class="diagrama-nodo">Chicanito Móvil 5</div>
    </div>
  </div>
</section>

<section class="bloque" id="bloque-04">
  <p class="eyebrow">04 · La cocina se queda en Jojutla</p>
  <h2>Tú no compras una receta. Compras un negocio que ya funciona.</h2>
  <p>Toda la producción permanece en nuestra planta de Jojutla. El pollo sale marinado, empacado pieza por pieza, a dos grados. Llega a tu sucursal listo para meterse al horno.</p>
  <p>Tú no compras insumos. No negocias con proveedores. No manejas mermas de proceso. No necesitas un cocinero.</p>
  <p class="destacado">Tu sucursal enciende el horno y vende.</p>
  <p>Eso significa mucho menos gente para operar. Y significa que el sabor es exactamente el mismo en Jojutla que en Ciudad de México, todos los días, sin depender de quién esté en turno.</p>
</section>

<section class="bloque" id="bloque-05">
  <p class="eyebrow">05 · La prueba</p>
  <h2>Esto no es una idea. Es una operación con más de veinte años y números en el sistema.</h2>
  <div class="cifras-grid">
    <div class="cifra"><span class="cifra-valor">$9,828,017</span><span class="cifra-label">Venta de los últimos doce meses</span></div>
    <div class="cifra"><span class="cifra-valor">$29,449</span><span class="cifra-label">Venta promedio por día</span></div>
    <div class="cifra"><span class="cifra-valor">$163</span><span class="cifra-label">Ticket promedio — creció 22% en dos años</span></div>
    <div class="cifra"><span class="cifra-valor">6</span><span class="cifra-label">Meses consecutivos creciendo contra el año anterior</span></div>
    <div class="cifra"><span class="cifra-valor">+16.2%</span><span class="cifra-label">Crecimiento en el último mes cerrado</span></div>
    <div class="cifra"><span class="cifra-valor">31%</span><span class="cifra-label">Costo de insumos</span></div>
    <div class="cifra"><span class="cifra-valor">78.5%</span><span class="cifra-label">Del ingreso lo generan 12 productos del menú</span></div>
  </div>
  <p><strong>Todo se lo llevan.</strong> Chicken Chicanito no tiene mesas. El cien por ciento de la venta sale por la puerta. El producto ya viaja y el cliente ya lo acepta así — no es un supuesto del modelo, es como opera el negocio desde el primer día.</p>
  <p><strong>La receta lleva dos generaciones.</strong> El negocio nació con el papá de Lilian López y hoy opera bajo la marca Chicken Chicanito. Lo que vas a vender no se inventó para esta franquicia: lleva más de veinte años probándose con clientes que regresan.</p>
  <p><strong>La cocina tiene capacidad de producción de sobra.</strong> El 24 y el 31 de diciembre despachamos más de cuatrocientos tickets en un día, contra un promedio normal de ciento setenta y cinco. La capacidad para crecer ya está instalada y pagada.</p>
</section>

<section class="bloque" id="bloque-06">
  <p class="eyebrow">06 · El modelo Móvil</p>
  <h2>El activo que se paga solo.</h2>
  <p>Un Chicanito Móvil completo cuesta $300,000. Operarlo cuesta $14,200 al año: gasolina, mantenimiento, seguro y permisos.</p>
  <p>Vendiendo veintisiete pollos al día —conservador, muy por debajo de lo que esperamos— genera cerca de <strong>$1.5 millones de venta al año.</strong></p>
  <p>No lleva cocina. No lleva personal fijo. Lo opera un socio con sueldo base y comisión por venta, así que gana más cuando vende más.</p>
  <p class="destacado">Cada Chicanito Móvil se paga en menos de seis meses.</p>
  <p>Entra uno por año. No tienes que comprar cinco de golpe: los siguientes salen del flujo que el negocio ya está generando.</p>
</section>

<section class="bloque" id="bloque-07">
  <p class="eyebrow">07 · Los números de tu unidad</p>
  <h2>Bloque interactivo. Mueve las variables tú mismo.</h2>
  <div id="simulador-root" data-tipo-cambio-default="">
    <p class="simulador-cargando">Cargando el simulador…</p>
  </div>
</section>

<section class="bloque" id="bloque-08">
  <p class="eyebrow">08 · Cómo gana la marca</p>
  <h2>No ganamos en el producto. Ganamos solo si tú creces.</h2>
  <p>Te vendemos el producto prácticamente a costo. Nuestro costo de receta está en el sistema y lo puedes auditar: el paquete completo nos cuesta setenta y cuatro pesos, y te lo transferimos en ochenta. Esos seis pesos son mano de obra de producción, empaque y flete. Nada más.</p>
  <p>Nuestra ganancia está en la regalía. <strong>Si tú no vendes, nosotros no ganamos.</strong></p>
  <p>Es la única estructura en la que nos conviene exactamente lo mismo que a ti.</p>
</section>

<section class="bloque" id="bloque-09">
  <p class="eyebrow">09 · Qué incluye la licencia</p>
  <p class="destacado destacado--grande">USD $25,000 — una sucursal CEDIS y cinco puntos móviles.</p>
  <p>Son seis licencias operativas. <strong>Poco más de cuatro mil dólares por punto de venta.</strong></p>
  <ul class="lista-incluye">
    <li>Uso de marca Chicken Chicanito, ROSTI y CRUJI</li>
    <li>Acompañamiento llave en mano: desde el contrato con el arrendador hasta el primer Chicanito Móvil en la calle</li>
    <li>Manuales de operación de sucursal y de Chicanito Móvil</li>
    <li>Capacitación completa de tu equipo y de tus socios operativos</li>
    <li>Abastecimiento garantizado tres veces por semana, con flete a nuestro costo</li>
    <li>Territorio exclusivo por cada 250,000 habitantes</li>
  </ul>
  <p><strong>Regalía:</strong> 6% sobre ventas · <strong>Fondo de publicidad:</strong> 1%<br><strong>Vigencia:</strong> 5 años, renovable</p>
</section>

<section class="bloque" id="bloque-10">
  <p class="eyebrow">10 · Cómo nos comparamos</p>
  <h2>Seis puntos de venta por el precio de uno.</h2>
  <p>Las franquicias de pollo en México venden lo mismo desde hace treinta años: una licencia, un local, un punto de venta. La cuota de entrada de una cadena establecida ronda los $280,000 pesos por ese único punto.</p>
  <p>Chicanito CEDIS entrega seis.</p>
  <table class="tabla-comparacion">
    <thead>
      <tr><th></th><th>Chicanito CEDIS</th><th>Franquicia de pollo tradicional</th></tr>
    </thead>
    <tbody>
      <tr class="fila-peso"><td>Puntos de venta por licencia</td><td><strong>6</strong></td><td>1</td></tr>
      <tr class="fila-peso"><td>Costo por punto de venta</td><td><strong>$77,000</strong></td><td>$280,000</td></tr>
      <tr><td>Horas de venta al día</td><td>Todo el día, en seis ubicaciones</td><td>Las horas pico de una esquina</td></tr>
      <tr><td>Cocina de producción a tu cargo</td><td>No</td><td>Sí</td></tr>
      <tr><td>Margen de la marca sobre el producto que te vende</td><td>Ninguno</td><td>—</td></tr>
    </tbody>
  </table>
  <h3>Una operación que no se parece al promedio.</h3>
  <p>Una rosticería bien establecida en México factura entre cincuenta y ciento cincuenta mil pesos al mes.</p>
  <p class="destacado">Jojutla hace $818,000.</p>
  <p>Cinco veces y media el techo de lo que la industria considera un buen resultado. Y sin mesas, sin delivery y sin haber salido nunca a la calle.</p>
  <h3>El mercado no es el problema.</h3>
  <p>El mexicano come treinta y cinco kilos de pollo al año, de acuerdo con la Unión Nacional de Avicultores. Es de los productos de consumo más constante del país: no depende de modas, no depende de temporada, no se sustituye.</p>
  <p>La pregunta nunca fue si hay demanda. Fue quién llega primero a donde está.</p>
</section>

<section class="bloque" id="bloque-11">
  <p class="eyebrow">11 · Las tres preguntas que siempre nos hacen</p>
  <h2>Y las respuestas completas, no las cómodas.</h2>
  <p><strong>Nuestro producto es fresco, y eso impone una disciplina.</strong> Nunca se congela, por eso dura de dos a tres días. Surtimos tres veces por semana y el pedido se planea. La merma corre por tu cuenta y en los primeros meses vas a fallar el pronóstico. Lo presupuestamos en 5% y te acompañamos a bajarlo.</p>
  <p><strong>Nada se compara con Ciudad de México, y eso corta para los dos lados.</strong> La demanda es mucho mayor y también la competencia. Proyectamos el primer año a $7 millones — la mitad de lo que hace Jojutla hoy — precisamente porque una plaza nueva se construye.</p>
  <p><strong>Es un modelo de venta que ya funciona.</strong> Miles de food trucks operan en Ciudad de México todos los días. Es un trabajo de calle que hay que hacer bien, y te acompañamos a hacerlo.</p>
</section>

<section class="bloque bloque--cierre" id="bloque-12">
  <p class="eyebrow">12 · Cierre</p>
  <h2>El primero decide dónde.</h2>
  <p>Hay una sola licencia disponible para Ciudad de México, y quien la tome escoge su territorio antes que nadie: la zona, la esquina, los cinco puntos donde van a parar los Chicanito Móvil.</p>
  <p>Los que vengan después van a escoger de lo que sobre.</p>
  <p>Más de veinte años de operación, un producto probado, una cocina que no tienes que aprender a manejar y seis puntos de venta desde el día uno.</p>
  <p class="destacado destacado--grande">Lo único que falta eres tú.</p>

  <div class="agenda-visita">
    <h3>Agenda tu visita a Jojutla</h3>
    <p>Ven a ver la operación un domingo. Es nuestro día más fuerte: vas a ver la cocina a tope, la fila en el mostrador y el Chicanito Móvil cargando.</p>
    <p>Nadie firma una franquicia por un documento. Se firma después de probar el pollo.</p>
  </div>

  <form id="form-solicitud" class="form-solicitud" novalidate>
    <h3>Solicitar visita y llamada</h3>
    <div class="campo">
      <label for="f-nombre">Nombre completo</label>
      <input id="f-nombre" name="nombre" type="text" required>
    </div>
    <div class="campo">
      <label for="f-telefono">Teléfono</label>
      <input id="f-telefono" name="telefono" type="tel" required>
    </div>
    <div class="campo">
      <label for="f-correo">Correo</label>
      <input id="f-correo" name="correo" type="email" required>
    </div>
    <div class="campo">
      <label for="f-ciudad">Ciudad de interés</label>
      <input id="f-ciudad" name="ciudad" type="text" required>
    </div>
    <div class="campo">
      <label for="f-capital">Capital disponible para invertir</label>
      <select id="f-capital" name="capital_rango">
        <option value="">Prefiero comentarlo en la llamada</option>
        <option value="menos-2m">Menos de $2M</option>
        <option value="2m-4m">$2M–$4M</option>
        <option value="4m-6m">$4M–$6M</option>
        <option value="mas-6m">Más de $6M</option>
      </select>
    </div>
    <div class="campo">
      <label for="f-como">¿Cómo nos conociste?</label>
      <input id="f-como" name="como_nos_conociste" type="text">
    </div>
    <input type="text" name="empresa" class="honeypot" tabindex="-1" autocomplete="off" aria-hidden="true">
    <div class="campo campo--checkbox">
      <label><input type="checkbox" name="consentimiento" required> Acepto ser contactado sobre esta oportunidad de franquicia. <a href="/privacidad.html" target="_blank" rel="noopener">Aviso de privacidad</a>.</label>
    </div>
    <button type="submit">Solicitar visita y llamada</button>
    <p class="form-mensaje" role="status" aria-live="polite"></p>
  </form>

  <p class="nota-legal">Los datos de Jojutla provienen del sistema de punto de venta y corresponden al periodo agosto 2025 – julio 2026. Las cifras de Ciudad de México son proyecciones basadas en esa operación y no constituyen garantía de resultados. Chicken Chicanito® · Very Sabrosito · Very Rapidito.</p>
</section>
`;
}

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Método no permitido' });
    return;
  }

  const code = readSession(req);
  if (!code) {
    res.setHeader('Cache-Control', 'no-store');
    res.status(401).json({ error: 'Sesión inválida o vencida' });
    return;
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    res.status(500).json({ error: 'DATABASE_URL no configurada' });
    return;
  }

  const sql = getSql();
  await ensureTables(sql);

  // La cookie por sí sola no sabe si la clave fue revocada después de
  // emitirse — se reconfirma contra la base en cada carga de la guía.
  if (!(await codeIsActive(sql, code))) {
    res.setHeader('Cache-Control', 'no-store');
    res.status(401).json({ error: 'Sesión inválida o vencida' });
    return;
  }

  let tipoCambio = 18.5;
  try {
    const filas = await sql`SELECT value FROM settings WHERE key = 'tipo_cambio'`;
    if (filas[0]) tipoCambio = parseFloat(filas[0].value);
  } catch {
    // si falla la lectura del tipo de cambio, se usa el default — nunca bloquea la guía
  }

  res.setHeader('Cache-Control', 'private, no-store');
  res.status(200).json({ ok: true, code, tipoCambio, html: html() });
};
