// GET /api/guia — devuelve el HTML de los 12 bloques SOLO si la sesión es
// válida. Sin sesión válida, no sale ni un byte del copy (401, sin cuerpo con
// contenido). El shell público (guia.html) no trae el contenido embebido: lo
// pide aquí después de que el navegador ya trae la cookie de sesión.
const { readSession } = require('../lib/session');
const { getSql, ensureTables, getCodeStatus } = require('../lib/db');

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
  <p class="eyebrow">Chicken Chicanito · Sociedad de capital para expansión</p>
  <h1 class="titular">Una sociedad de capital para la Tienda Insignia de Chicken Chicanito en la Ciudad de México.</h1>
  <p class="bajada">Chicken Chicanito genera $9.8 millones de pesos al año en una sola ubicación, en Jojutla, sin una mesa y sin haber salido nunca a la calle. Buscamos un socio capitalista para abrir la Tienda Insignia de la marca en la Ciudad de México, junto con sus cinco puntos Chicanito Móvil asociados. La operación completa —cadena de suministro, personal, procesos y estrategia comercial— es responsabilidad exclusiva de Chicanito.</p>
  <p class="pie-portada">Tienda Insignia: Ciudad de México · Sociedad de capital disponible</p>
</section>

<section class="bloque" id="bloque-02">
  <p class="eyebrow">02 · El fundamento del modelo</p>
  <h2>Una rosticería con ubicación fija paga renta, nómina y equipo todo el día, pero concentra la venta en unas cuantas horas.</h2>
  <p>En Jojutla lo medimos con precisión: <strong>el 63% de la venta ocurre entre la una y las cuatro de la tarde.</strong> A las nueve de la mañana, la operación factura menos de cuatrocientos pesos. Después de las cinco, prácticamente se detiene.</p>
  <div class="grafica-horas" role="img" aria-label="Venta promedio por hora en Jojutla, últimos 90 días. La franja de 13 a 16 horas concentra el 63% de la venta del día.">
    ${barritasHora()}
  </div>
  <div class="grafica-horas-leyenda">
    <span><i class="dot dot--semana"></i> Entre semana</span>
    <span><i class="dot dot--finde"></i> Fin de semana</span>
    <span class="grafica-horas-nota">13–16h = 63% de la venta del día</span>
  </div>
  <p>El negocio nunca tuvo un problema de demanda. Tuvo un problema de inmovilidad: la infraestructura —equipo, personal, capacidad de producción— permanecía sin usarse la mayor parte del día.</p>
  <p>El modelo que Chicanito opera en cada mercado resuelve esto combinando una tienda fija con puntos de venta móviles, de manera que la misma inversión en infraestructura genera ingresos durante todo el día, no solo en las horas de mayor demanda.</p>
</section>

<section class="bloque bloque--azul" id="bloque-03">
  <p class="eyebrow">03 · El modelo</p>
  <h2>Que la Tienda Insignia no dependa únicamente de la venta que ocurre dentro de sus cuatro paredes.</h2>
  <p><strong>Chicanito CEDIS</strong> es una Tienda Insignia que opera además como centro de distribución de cinco unidades Chicanito Móvil, los puntos de venta rodantes de la marca.</p>
  <p>Cada mañana, en la hora de menor actividad, las unidades Chicanito Móvil cargan producto y se distribuyen hacia los puntos donde la demanda ya existe: escuelas, zonas empresariales, parques industriales. Regresan al cierre de operaciones.</p>
  <p>La Tienda Insignia vende en su ubicación. Las cinco unidades Móviles venden en cinco ubicaciones adicionales.</p>
  <p class="destacado">Misma renta. Mismo equipo. Misma nómina base. Seis puntos de venta.</p>
  <div class="diagrama-cedis">
    <div class="diagrama-nodo diagrama-nodo--centro">Tienda Insignia CEDIS</div>
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
  <p class="eyebrow">04 · La operación es responsabilidad de Chicanito</p>
  <h2>El valor no está solo en la receta. Está en cómo se ejecuta, todos los días.</h2>
  <p>El valor de Chicken Chicanito no está únicamente en la receta. Está en la consistencia con la que esa receta se ejecuta, todos los días, en cada punto de venta — una consistencia construida durante más de veinte años de atención sostenida a los detalles operativos: cómo se marina, cómo se conserva, cómo se cocina, cómo se atiende.</p>
  <p class="destacado">Esa consistencia es el activo. Y un activo así no se transfiere junto con una licencia: se pierde en el momento en que la operación pasa a manos de un tercero que no comparte el mismo estándar ni la misma experiencia acumulada.</p>
  <p>Por eso el modelo no se franquicia ni se licencia. La operación permanece, sin excepción, a cargo de Chicanito.</p>
  <p>La producción continúa centralizada en la planta de Jojutla. El producto sale marinado, empacado por pieza, refrigerado, y llega a la Tienda Insignia listo para su preparación final.</p>
  <p><strong>Chicanito es responsable de la totalidad de la operación:</strong></p>
  <ul class="lista-incluye">
    <li>Cadena de suministro y abastecimiento</li>
    <li>Contratación, capacitación y gestión del personal, tanto de la Tienda Insignia como de las unidades Móviles</li>
    <li>Procesos operativos diarios</li>
    <li>Estrategia comercial y de redes sociales</li>
  </ul>
  <p>El socio capitalista no participa en ninguno de estos procesos. Su aportación es exclusivamente el capital necesario para la apertura.</p>
</section>

<section class="bloque" id="bloque-05">
  <p class="eyebrow">05 · La evidencia operativa</p>
  <h2>Esto no es un modelo hipotético. Es una operación con más de veinte años y números en el sistema.</h2>
  <div class="cifras-grid">
    <div class="cifra"><span class="cifra-valor">$9,828,017</span><span class="cifra-label">Venta de los últimos doce meses — Jojutla</span></div>
    <div class="cifra"><span class="cifra-valor">$29,449</span><span class="cifra-label">Venta promedio por día</span></div>
    <div class="cifra"><span class="cifra-valor">$163</span><span class="cifra-label">Ticket promedio — creció 22% en dos años</span></div>
    <div class="cifra"><span class="cifra-valor">6</span><span class="cifra-label">Meses consecutivos creciendo contra el año anterior</span></div>
    <div class="cifra"><span class="cifra-valor">+16.2%</span><span class="cifra-label">Crecimiento en el último mes cerrado</span></div>
    <div class="cifra"><span class="cifra-valor">31%</span><span class="cifra-label">Costo de insumos</span></div>
    <div class="cifra"><span class="cifra-valor">78.5%</span><span class="cifra-label">Del ingreso lo generan 12 productos del menú</span></div>
  </div>
  <p><strong>Todo se lo llevan.</strong> Chicken Chicanito no tiene mesas. El cien por ciento de la venta sale por la puerta. El producto ya viaja y el cliente ya lo acepta así — no es un supuesto del modelo, es como opera el negocio desde el primer día.</p>
  <p><strong>La receta lleva dos generaciones.</strong> El negocio nació con el papá de Lilian López y hoy opera bajo la marca Chicken Chicanito. Lleva más de veinte años probándose con clientes que regresan.</p>
  <p><strong>La cocina tiene capacidad de producción de sobra.</strong> El 24 y el 31 de diciembre despachamos más de cuatrocientos tickets en un día, contra un promedio normal de ciento setenta y cinco. La capacidad para crecer ya está instalada y pagada.</p>
  <p>La Tienda Insignia de Ciudad de México es la expansión de este modelo probado — no una réplica sin historial, sino la aplicación del mismo sistema operativo, la misma receta y la misma disciplina que ya generan estos resultados en Jojutla.</p>
</section>

<section class="bloque" id="bloque-06">
  <p class="eyebrow">06 · El modelo Móvil</p>
  <h2>El activo que se paga solo.</h2>
  <p>Un Chicanito Móvil completo cuesta $300,000. Operarlo cuesta $14,200 al año: gasolina, mantenimiento, seguro y permisos.</p>
  <div class="bloque-personaje bloque-personaje--movil">
    <img src="/assets/chicanito-movil.png" alt="Chicanito Móvil">
  </div>
  <p>Vendiendo veintisiete pollos al día —conservador, muy por debajo de lo que esperamos— genera cerca de <strong>$1.5 millones de venta al año.</strong></p>
  <p>Chicanito contrata y gestiona al socio operativo de cada unidad, bajo un esquema de sueldo base más comisión por venta. El socio capitalista no participa en esta gestión.</p>
  <p class="destacado">Cada Chicanito Móvil se recupera en menos de seis meses.</p>
  <p>Entra uno por año. No se compran cinco de golpe: los siguientes salen del flujo que el negocio ya está generando.</p>
</section>

<section class="bloque bloque--simulador" id="bloque-07">
  <p class="eyebrow">07 · Proyección financiera</p>
  <h2>Bloque interactivo. Mueve las variables tú mismo.</h2>
  <p>Los términos definitivos de participación se establecen en conversación directa con cada socio, de acuerdo con el capital aportado. Este simulador permite explorar la economía de la Tienda Insignia bajo distintos escenarios, con un porcentaje de participación ilustrativo ajustable para dimensionar un retorno de ejemplo.</p>
  <div id="simulador-root" data-tipo-cambio-default="">
    <p class="simulador-cargando">Cargando el simulador…</p>
  </div>
</section>

<section class="bloque" id="bloque-08">
  <p class="eyebrow">08 · Distribución de utilidades</p>
  <h2>La utilidad del socio depende del desempeño del negocio.</h2>
  <p>Si la Tienda Insignia no genera utilidad, el socio capitalista no recibe utilidad.</p>
  <p>Los términos específicos de distribución —porcentaje, periodicidad y mecanismo— se acuerdan de manera individual con cada socio capitalista, en función del capital aportado y del alcance de la sociedad.</p>
</section>

<section class="bloque" id="bloque-09">
  <p class="eyebrow">09 · Aportación de cada parte</p>
  <h2>Capital de un lado. Operación completa del otro.</h2>
  <p><strong>El socio capitalista aporta:</strong> el capital necesario para la apertura de la Tienda Insignia. El monto se determina según el tamaño de la ubicación y la capacidad de producción requerida, y se define con precisión durante la conversación directa.</p>
  <p><strong>Chicanito aporta:</strong></p>
  <ul class="lista-incluye">
    <li>Uso de marca Chicken Chicanito, ROSTI y CRUJI</li>
    <li>Operación integral: cadena de suministro, personal, procesos</li>
    <li>Manuales de operación de Tienda Insignia y de Chicanito Móvil</li>
    <li>Capacitación completa del equipo operativo</li>
    <li>Abastecimiento garantizado, con logística a su cargo</li>
    <li>Estrategia comercial y de redes sociales</li>
  </ul>
  <p>Los términos de la sociedad —incluyendo su formalización legal— se establecen conforme a lo acordado entre ambas partes.</p>
</section>

<section class="bloque" id="bloque-10">
  <p class="eyebrow">10 · Cómo se compara esta oportunidad</p>
  <div class="logo-box"><img src="/assets/logo-badge.jpg" alt="Chicken Chicanito"></div>
  <h2>Un sistema probado, no una idea nueva.</h2>
  <p>Invertir capital en un negocio nuevo implica, casi siempre, invertir en un modelo sin historial: una idea validada, en el mejor de los casos, por proyecciones.</p>
  <p>Esta oportunidad es distinta. Chicken Chicanito tiene más de veinte años de operación, una receta probada, una cocina con capacidad de producción instalada y un modelo de expansión —Tienda Insignia más puntos Móviles— ya operando con resultados verificables.</p>
  <table class="tabla-comparacion">
    <thead>
      <tr><th></th><th>Chicanito CEDIS</th><th>Negocio nuevo sin trayectoria</th></tr>
    </thead>
    <tbody>
      <tr class="fila-peso"><td>Años de operación del modelo</td><td><strong>Más de 20</strong></td><td>Ninguno</td></tr>
      <tr class="fila-peso"><td>Producto y receta</td><td><strong>Probados</strong></td><td>Por validar</td></tr>
      <tr><td>Consistencia operativa</td><td>Un solo equipo, un solo estándar</td><td>Depende de quien lo ejecute</td></tr>
      <tr><td>Capacidad de producción</td><td>Instalada y pagada</td><td>Por construir</td></tr>
      <tr><td>Responsabilidad de la operación diaria</td><td>A cargo de Chicanito</td><td>A cargo del socio o de un tercero contratado</td></tr>
    </tbody>
  </table>
  <p>El capital no financia una idea. Financia la réplica de un sistema que ya funciona, con la operación completa a cargo de quien lo desarrolló y lo conoce.</p>
  <p class="destacado"><strong>A diferencia de un modelo de franquicia</strong>, donde la consistencia depende de cada operador individual y varía de sucursal a sucursal, aquí la opera un solo equipo, con un solo estándar. Esa es la razón por la que este modelo se estructura como sociedad de capital y no como franquicia: la consistencia no se delega.</p>
  <h3>Una operación que no se parece al promedio.</h3>
  <p>Una rosticería bien establecida en México factura entre cincuenta y ciento cincuenta mil pesos al mes.</p>
  <p class="destacado">Jojutla hace $818,000.</p>
  <p>Cinco veces y media el techo de lo que la industria considera un buen resultado. Y sin mesas, sin delivery y sin haber salido nunca a la calle.</p>
  <h3>El mercado no es el problema.</h3>
  <p>El mexicano come treinta y cinco kilos de pollo al año, de acuerdo con la Unión Nacional de Avicultores. Es de los productos de consumo más constante del país: no depende de modas, no depende de temporada, no se sustituye.</p>
  <p>La pregunta nunca fue si hay demanda. Fue quién llega primero a donde está.</p>
</section>

<section class="bloque" id="bloque-11">
  <p class="eyebrow">11 · Preguntas frecuentes</p>
  <h2>Y las respuestas completas, no las cómodas.</h2>
  <p><strong>¿Cómo se protege mi capital?</strong> La operación permanece bajo la responsabilidad directa de Chicanito, con el mismo sistema, los mismos manuales y los mismos controles que ya operan en Jojutla. La transparencia de resultados —venta, costos, utilidad— es parte de la sociedad.</p>
  <p><strong>¿Cómo doy seguimiento sin participar en la operación?</strong> El socio capitalista recibe reportes periódicos de desempeño. No participa en la operación diaria, pero mantiene visibilidad completa sobre los resultados del negocio.</p>
  <p><strong>¿Qué pasa si las ventas no llegan a lo proyectado?</strong> Las proyecciones de Ciudad de México son conservadoras frente a lo que ya genera Jojutla, precisamente porque una plaza nueva se construye. Cualquier desviación frente a lo proyectado se revisa junto con el socio, con la misma transparencia con la que se reportan los resultados.</p>
</section>

<section class="bloque bloque--cierre" id="bloque-12">
  <div class="cintillo-cierre">
    <img src="/assets/mascota.png" alt="" aria-hidden="true" class="cintillo-mascota">
    <p class="eyebrow">12 · Cierre</p>
    <h2>El primero decide dónde.</h2>
    <p>Hay una sola Tienda Insignia disponible para Ciudad de México, y quien la desarrolle define su ubicación antes que cualquier otro socio: la zona, y los cinco puntos donde operarán las unidades Chicanito Móvil.</p>
    <p>Más de veinte años de operación, un producto probado, y una estructura donde la operación completa está a cargo de quien ya sabe operarla.</p>
    <p class="destacado destacado--grande">Lo único que falta es el capital.</p>
  </div>

  <div class="agenda-visita">
    <h3>Agenda tu visita a Jojutla</h3>
    <p>Ven a ver la operación en persona antes de formalizar la sociedad. Es nuestro día más fuerte los domingos: vas a ver la cocina a tope, la fila en el mostrador y el Chicanito Móvil cargando.</p>
    <p>Nadie formaliza una sociedad por un documento. Se firma después de probar el pollo.</p>
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
      <label><input type="checkbox" name="consentimiento" required> Acepto ser contactado sobre esta oportunidad de sociedad de capital. <a href="/privacidad.html" target="_blank" rel="noopener">Aviso de privacidad</a>.</label>
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

  // La cookie por sí sola no sabe si la clave fue revocada (o si todavía no
  // acepta confidencialidad) — se reconfirma contra la base en cada carga.
  const estado = await getCodeStatus(sql, code);
  if (!estado.active) {
    res.setHeader('Cache-Control', 'no-store');
    res.status(401).json({ error: 'Sesión inválida o vencida' });
    return;
  }
  if (!estado.ndaAccepted) {
    res.setHeader('Cache-Control', 'no-store');
    res.status(403).json({ error: 'Falta aceptar confidencialidad', needsTerms: true });
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
