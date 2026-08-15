// Simulador financiero — bloque 07. Usa calcular()/CONST/DEFAULTS de
// calculo-chicanito.js SIN TOCARLOS (regla no negociable del brief), y
// distribuir()/CASCADA_DEFAULTS de cascada.js para repartir la utilidad
// entre el socio y la operadora. Esta capa solo construye la UI (sliders,
// indicadores, barra de cascada, tabla) alrededor de ambos motores.
import { calcular, DEFAULTS } from './calculo-chicanito.js';
import { distribuir, CASCADA_DEFAULTS } from './cascada.js';

const mxn = (n) => '$' + Math.round(n).toLocaleString('es-MX');
const pct2 = (v) => (v * 100).toFixed(2) + '%';

const CAMPOS_OPERACION = [
  { key: 'ventaAno1', label: 'Venta del satélite, año 1', min: 3000000, max: 15000000, step: 250000, fmt: mxn },
  { key: 'g', label: 'Ritmo de crecimiento', min: 0.15, max: 1.20, step: 0.05, fmt: (v) => Math.round(v * 100) + '%' },
  { key: 'pollosMotoDia', label: 'Pollos por Chicanito Móvil al día', min: 10, max: 100, step: 1, fmt: (v) => String(Math.round(v)) },
  { key: 'motosTotales', label: 'Chicanito Móvil al año 5', min: 0, max: 5, step: 1, fmt: (v) => String(Math.round(v)) },
  { key: 'diasMotoSemana', label: 'Días de operación por móvil', min: 4, max: 7, step: 1, fmt: (v) => String(Math.round(v)) },
  { key: 'precioPaquete', label: 'Precio del paquete', min: 150, max: 300, step: 1, fmt: mxn },
  { key: 'rentaMensual', label: 'Renta mensual', min: 20000, max: 150000, step: 2500, fmt: mxn },
  { key: 'nominaPct', label: 'Nómina sobre ventas (%)', min: 10, max: 30, step: 0.5, fmt: (v) => v.toFixed(1) + '%' },
];

const CAMPOS_COMERCIALES = [
  { key: 'operacionPct', label: 'Contraprestación de operación', min: 0, max: 0.03, step: 0.0025, fmt: pct2 },
  { key: 'marcaPct', label: 'Fondo de marca', min: 0, max: 0.03, step: 0.0025, fmt: pct2 },
  { key: 'escalon2Inv', label: 'Preferente al socio (escalón 2)', min: 0.50, max: 0.80, step: 0.05, fmt: (v) => Math.round(v * 100) + '%' },
  { key: 'multiploPreferente', label: 'Umbral del preferente', min: 1.5, max: 3.0, step: 0.25, fmt: (v) => v.toFixed(2) + 'x' },
];

const CAMPOS_SUPUESTOS = [
  { key: 'equipoSatelite', label: 'Equipo del satélite', min: 800000, max: 2500000, step: 50000, fmt: mxn },
  { key: 'adaptacion', label: 'Adaptación del local', min: 100000, max: 1200000, step: 25000, fmt: mxn },
  { key: 'costoMotocarro', label: 'Costo de un Chicanito Móvil', min: 150000, max: 500000, step: 10000, fmt: mxn },
  { key: 'precioTransferencia', label: 'Precio de transferencia por paquete', min: 55, max: 140, step: 1, fmt: mxn },
  { key: 'otrosPct', label: 'Otros gastos e imprevistos (%)', min: 4, max: 20, step: 0.5, fmt: (v) => v.toFixed(1) + '%' },
];

const TODOS_LOS_CAMPOS = [...CAMPOS_OPERACION, ...CAMPOS_COMERCIALES, ...CAMPOS_SUPUESTOS];

function sliderFila(campo, valores) {
  return `
    <div class="sim-slider-fila" data-key="${campo.key}">
      <div class="sim-slider-cabeza">
        <span>${campo.label}</span>
        <span class="sim-slider-valor">${campo.fmt(valores[campo.key])}</span>
      </div>
      <input type="range" min="${campo.min}" max="${campo.max}" step="${campo.step}" value="${valores[campo.key]}" aria-label="${campo.label}">
    </div>`;
}

function esqueleto(valores) {
  return `
    <div class="sim-etiqueta">Proyección basada en la operación real de Jojutla. La cascada de reparto y el monto de arranque son los términos propuestos; los definitivos se establecen por acuerdo directo. No constituye garantía de resultados.</div>

    <div class="sim-primarias">
      <div class="sim-primaria"><div class="sim-primaria-label">Recupero mi capital en el</div><div class="sim-primaria-valor" data-out="paybackSocio">—</div></div>
      <div class="sim-primaria"><div class="sim-primaria-label">Recibo en 5 años</div><div class="sim-primaria-valor" data-out="invTotal">—</div></div>
      <div class="sim-primaria"><div class="sim-primaria-label">Sobre mi capital</div><div class="sim-primaria-valor" data-out="multiploSocio">—</div></div>
      <div class="sim-primaria"><div class="sim-primaria-label">De la utilidad total</div><div class="sim-primaria-valor" data-out="pctUtilidad">—</div></div>
    </div>

    <div class="sim-cascada-wrap">
      <div class="sim-cascada" data-out="cascada"></div>
      <div class="sim-cascada-leyenda">
        <span class="sim-leyenda-item"><i class="sim-leyenda-dot sim-leyenda-dot--1"></i>Recuperación de capital</span>
        <span class="sim-leyenda-item"><i class="sim-leyenda-dot sim-leyenda-dot--2"></i>Preferente 60/40</span>
        <span class="sim-leyenda-item"><i class="sim-leyenda-dot sim-leyenda-dot--3"></i>Reparto 50/50</span>
      </div>
    </div>

    <div class="sim-secundarias">
      <div class="sim-secundaria"><div class="sim-secundaria-label">Inversión total</div><div class="sim-secundaria-valor" data-out="inversionTotal">—</div></div>
      <div class="sim-secundaria"><div class="sim-secundaria-label">Utilidad repartible del proyecto</div><div class="sim-secundaria-valor" data-out="utilidadProyecto">—</div></div>
      <div class="sim-secundaria"><div class="sim-secundaria-label">Venta total a 5 años</div><div class="sim-secundaria-valor" data-out="ventaTotal">—</div></div>
      <div class="sim-secundaria" title="Superior al promedio del sector porque la contraprestación de marca y operación es de 2% de ventas, no del 6–7% habitual en franquicias de alimentos. Ese diferencial permanece en la unidad."><div class="sim-secundaria-label">Margen neto de la unidad</div><div class="sim-secundaria-valor" data-out="margenProm">—</div></div>
    </div>

    <div class="sim-etiqueta sim-etiqueta--arranque">Partida de trámites, constitución y arranque: <strong>${mxn(valores.arranqueMXN)}</strong> — tope fijo, no ajustable. Cualquier exceso lo absorbe Chicanito.</div>

    <h4 class="sim-grupo-titulo">Términos comerciales</h4>
    <div class="sim-sliders" data-grupo="comerciales">
      ${CAMPOS_COMERCIALES.map((c) => sliderFila(c, valores)).join('')}
    </div>

    <h4 class="sim-grupo-titulo">Escenario de operación</h4>
    <div class="sim-sliders" data-grupo="operacion">
      ${CAMPOS_OPERACION.map((c) => sliderFila(c, valores)).join('')}
    </div>

    <h4 class="sim-grupo-titulo">Supuestos de entrada</h4>
    <div class="sim-sliders" data-grupo="supuestos">
      ${CAMPOS_SUPUESTOS.map((c) => sliderFila(c, valores)).join('')}
    </div>

    <button type="button" class="btn btn-secondary sim-reset" data-out="reset">Restablecer valores</button>

    <h4 class="sim-grupo-titulo">Venta y utilidad por año</h4>
    <div class="sim-tabla-wrap">
      <table class="sim-tabla" data-out="tabla">
        <thead>
          <tr><th>Año</th><th>Venta</th><th>Utilidad repartible</th><th>Margen</th><th>Al socio</th><th>Operadora (utilidad)</th><th>Operadora (2% ventas)</th></tr>
        </thead>
        <tbody></tbody>
        <tfoot>
          <tr><td colspan="6">Múltiplo del proyecto (antes del reparto)</td><td data-out="multiploProyecto">—</td></tr>
        </tfoot>
      </table>
    </div>
  `;
}

function pintarCascada(el, escalonMes, payback, hito2x) {
  const barras = escalonMes.map((esc, i) =>
    `<div class="sim-cascada-mes sim-cascada-mes--${esc}" title="Mes ${i + 1}: escalón ${esc}"></div>`
  ).join('');

  const marcador = (mes, texto) => {
    if (!mes) return '';
    const left = ((mes - 0.5) / 60) * 100;
    return `<div class="sim-cascada-marcador" style="left:${left}%"><span>mes ${mes} · ${texto}</span></div>`;
  };

  el.innerHTML = `
    <div class="sim-cascada-barras">${barras}</div>
    ${marcador(payback, 'capital recuperado')}
    ${marcador(hito2x, '2x alcanzado')}
  `;
}

function pintarTabla(tbody, anios, invMes, opeMes, valores) {
  tbody.innerHTML = anios.map((a, i) => {
    const desde = i * 12;
    const hasta = desde + 12;
    const alSocio = invMes.slice(desde, hasta).reduce((s, x) => s + x, 0);
    const aOperadoraUtilidad = opeMes.slice(desde, hasta).reduce((s, x) => s + x, 0);
    // "Utilidad repartible" del año, neta de la reinversión en Chicanito Móvil
    // (años 2..motosTotales) — así es como memo-inversion-chicanito-cdmx.md y
    // el PDF la presentan, y así es como cascada.js la distribuye realmente:
    // debe cuadrar con Al socio + Operadora (utilidad). El margen sigue
    // calculándose sobre la utilidad bruta (calculo-chicanito.js), porque es
    // una razón operativa y no debe descontar reinversión de capital.
    const anioNum = a.n;
    const reinversion = anioNum >= 2 && anioNum <= valores.motosTotales ? valores.costoMotocarro : 0;
    const utilidadRepartible = a.utilidad - reinversion;
    return `
    <tr>
      <td>Año ${a.n}</td>
      <td>${mxn(a.venta)}</td>
      <td>${mxn(utilidadRepartible)}</td>
      <td>${Math.round(a.margen * 100)}%</td>
      <td>${mxn(alSocio)}</td>
      <td>${mxn(aOperadoraUtilidad)}</td>
      <td>${mxn(a.contraprestacion)}</td>
    </tr>`;
  }).join('');
}

export function montarSimulador(root) {
  const valores = { ...DEFAULTS, ...CASCADA_DEFAULTS };
  const valoresIniciales = { ...valores };

  root.innerHTML = esqueleto(valores);

  const outPaybackSocio = root.querySelector('[data-out="paybackSocio"]');
  const outInvTotal = root.querySelector('[data-out="invTotal"]');
  const outMultiploSocio = root.querySelector('[data-out="multiploSocio"]');
  const outPctUtilidad = root.querySelector('[data-out="pctUtilidad"]');
  const outInversionTotal = root.querySelector('[data-out="inversionTotal"]');
  const outUtilidadProyecto = root.querySelector('[data-out="utilidadProyecto"]');
  const outVentaTotal = root.querySelector('[data-out="ventaTotal"]');
  const outMargenProm = root.querySelector('[data-out="margenProm"]');
  const outMultiploProyecto = root.querySelector('[data-out="multiploProyecto"]');
  const outCascada = root.querySelector('[data-out="cascada"]');
  const outTabla = root.querySelector('[data-out="tabla"] tbody');
  const botonReset = root.querySelector('[data-out="reset"]');

  let onCambio = null;

  function recalcular() {
    const r = calcular(valores);
    const cfgCascada = { escalon2Inv: valores.escalon2Inv, multiploPreferente: valores.multiploPreferente };
    const c = distribuir(r.anios, r.inversion, valores, cfgCascada);
    const pctUtilidad = r.utilidadTotal > 0 ? (c.invTotal / r.utilidadTotal) * 100 : 0;
    const ventaTotal = r.anios.reduce((s, a) => s + a.venta, 0);
    const margenProm = ventaTotal > 0 ? (r.utilidadTotal / ventaTotal) * 100 : 0;

    outPaybackSocio.textContent = c.payback ? `mes ${c.payback}` : 'No se recupera en 60 meses';
    outInvTotal.textContent = mxn(c.invTotal);
    outMultiploSocio.textContent = c.multiplo.toFixed(2) + 'x';
    outPctUtilidad.textContent = Math.round(pctUtilidad) + '%';

    outInversionTotal.textContent = mxn(r.inversion);
    outUtilidadProyecto.textContent = mxn(r.utilidadTotal);
    outVentaTotal.textContent = mxn(ventaTotal);
    outMargenProm.textContent = Math.round(margenProm) + '%';
    outMultiploProyecto.textContent = r.multiplo.toFixed(2) + 'x';

    pintarCascada(outCascada, c.escalonMes, c.payback, c.hito2x);
    pintarTabla(outTabla, r.anios, c.invMes, c.opeMes, valores);

    return { r, c };
  }

  root.querySelectorAll('.sim-sliders input[type="range"]').forEach((input) => {
    const fila = input.closest('.sim-slider-fila');
    const key = fila.dataset.key;
    const campo = TODOS_LOS_CAMPOS.find((c) => c.key === key);
    const etiquetaValor = fila.querySelector('.sim-slider-valor');

    input.addEventListener('input', () => {
      const val = parseFloat(input.value);
      valores[key] = val;
      etiquetaValor.textContent = campo.fmt(val);
      const resultado = recalcular();
      if (onCambio) onCambio(key, val, resultado.r);
    });
  });

  botonReset.addEventListener('click', () => {
    Object.assign(valores, valoresIniciales);
    root.querySelectorAll('.sim-sliders input[type="range"]').forEach((input) => {
      const key = input.closest('.sim-slider-fila').dataset.key;
      input.value = valores[key];
      input.dispatchEvent(new Event('input'));
    });
  });

  recalcular();

  return {
    onCambio(fn) { onCambio = fn; },
    obtenerEscenario() {
      const r = calcular(valores);
      const cfgCascada = { escalon2Inv: valores.escalon2Inv, multiploPreferente: valores.multiploPreferente };
      const c = distribuir(r.anios, r.inversion, valores, cfgCascada);
      return { valores: { ...valores }, inversion: r.inversion, payback: c.payback, multiplo: c.multiplo };
    },
  };
}
