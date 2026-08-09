// Simulador financiero — bloque 07. Usa calcular()/CONST/DEFAULTS de
// calculo-chicanito.js SIN TOCARLOS (regla no negociable del brief). Esta
// capa solo construye la UI (sliders, indicadores, gráficas, tabla) alrededor.
import { calcular, DEFAULTS } from './calculo-chicanito.js';

const mxn = (n) => '$' + Math.round(n).toLocaleString('es-MX');

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

const CAMPOS_SUPUESTOS = [
  { key: 'cuotaUSD', label: 'Cuota de franquicia (USD)', min: 0, max: 60000, step: 1000, fmt: (v) => 'USD $' + Math.round(v).toLocaleString('es-MX') },
  { key: 'tipoCambio', label: 'Tipo de cambio', min: 15, max: 26, step: 0.10, fmt: (v) => '$' + v.toFixed(2) },
  { key: 'equipoSatelite', label: 'Equipo del satélite', min: 800000, max: 2500000, step: 50000, fmt: mxn },
  { key: 'adaptacion', label: 'Adaptación del local', min: 100000, max: 1200000, step: 25000, fmt: mxn },
  { key: 'costoMotocarro', label: 'Costo de un Chicanito Móvil', min: 150000, max: 500000, step: 10000, fmt: mxn },
  { key: 'precioTransferencia', label: 'Precio de transferencia por paquete', min: 55, max: 140, step: 1, fmt: mxn },
  { key: 'otrosPct', label: 'Otros gastos e imprevistos (%)', min: 4, max: 20, step: 0.5, fmt: (v) => v.toFixed(1) + '%' },
];

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
    <div class="sim-etiqueta">Proyección basada en la operación real de Jojutla. No constituye garantía de resultados.</div>

    <div class="sim-indicadores">
      <div class="sim-indicador sim-indicador--destacado">
        <div class="sim-indicador-label">Recuperas la inversión en</div>
        <div class="sim-indicador-valor" data-out="payback">—</div>
      </div>
      <div class="sim-indicador"><div class="sim-indicador-label">Inversión inicial</div><div class="sim-indicador-valor" data-out="inversion">—</div></div>
      <div class="sim-indicador"><div class="sim-indicador-label">Utilidad a 5 años</div><div class="sim-indicador-valor" data-out="utilidad">—</div></div>
      <div class="sim-indicador"><div class="sim-indicador-label">Retorno sobre lo invertido</div><div class="sim-indicador-valor" data-out="multiplo">—</div></div>
    </div>

    <div class="sim-barra-60" data-out="barra60" role="img" aria-label="Acumulado mes a mes durante 60 meses, rojo mientras es negativo, dorado al volverse positivo"></div>

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
          <tr><th>Año</th><th>Venta</th><th>Utilidad</th><th>Margen</th></tr>
        </thead>
        <tbody></tbody>
      </table>
    </div>
  `;
}

function pintarBarra60(el, serie) {
  const max = Math.max(...serie.map((v) => Math.abs(v)), 1);
  el.innerHTML = serie.map((v) => {
    const alto = Math.max(4, Math.round((Math.abs(v) / max) * 100));
    const clase = v >= 0 ? 'sim-mes sim-mes--positivo' : 'sim-mes';
    return `<div class="${clase}" style="height:${alto}%" title="Mes ${serie.indexOf(v) + 1}: ${mxn(v)}"></div>`;
  }).join('');
}

function pintarTabla(tbody, anios) {
  tbody.innerHTML = anios.map((a) => `
    <tr>
      <td>Año ${a.n}</td>
      <td>${mxn(a.venta)}</td>
      <td>${mxn(a.utilidad)}</td>
      <td>${Math.round(a.margen * 100)}%</td>
    </tr>
  `).join('');
}

export function montarSimulador(root, tipoCambioDefault) {
  const valores = { ...DEFAULTS };
  if (tipoCambioDefault) valores.tipoCambio = tipoCambioDefault;
  const valoresIniciales = { ...valores };

  root.innerHTML = esqueleto(valores);

  const outPayback = root.querySelector('[data-out="payback"]');
  const outInversion = root.querySelector('[data-out="inversion"]');
  const outUtilidad = root.querySelector('[data-out="utilidad"]');
  const outMultiplo = root.querySelector('[data-out="multiplo"]');
  const outBarra60 = root.querySelector('[data-out="barra60"]');
  const outTabla = root.querySelector('[data-out="tabla"] tbody');
  const botonReset = root.querySelector('[data-out="reset"]');

  let onCambio = null;

  function recalcular() {
    const r = calcular(valores);
    outPayback.textContent = r.payback ? `${r.payback} meses` : 'No se recupera en 60 meses';
    outInversion.textContent = mxn(r.inversion);
    outUtilidad.textContent = mxn(r.utilidadTotal);
    outMultiplo.textContent = r.multiplo.toFixed(2) + 'x';
    pintarBarra60(outBarra60, r.serie);
    pintarTabla(outTabla, r.anios);
    return r;
  }

  root.querySelectorAll('.sim-sliders input[type="range"]').forEach((input) => {
    const fila = input.closest('.sim-slider-fila');
    const key = fila.dataset.key;
    const campo = [...CAMPOS_OPERACION, ...CAMPOS_SUPUESTOS].find((c) => c.key === key);
    const etiquetaValor = fila.querySelector('.sim-slider-valor');

    input.addEventListener('input', () => {
      const val = parseFloat(input.value);
      valores[key] = val;
      etiquetaValor.textContent = campo.fmt(val);
      const r = recalcular();
      if (onCambio) onCambio(key, val, r);
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

  const resultadoInicial = recalcular();

  return {
    onCambio(fn) { onCambio = fn; },
    obtenerEscenario() {
      const r = calcular(valores);
      return { valores: { ...valores }, inversion: r.inversion, payback: r.payback, multiplo: r.multiplo };
    },
  };
}
