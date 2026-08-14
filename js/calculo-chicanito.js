// calculo-chicanito.js
// Motor de cálculo de la Guía del Inversionista — Chicanito CEDIS.
// Extraído textualmente del simulador validado. NO modificar las fórmulas
// de venta, curva de crecimiento, food cost, nómina, renta, servicios,
// admin y desechables: están calibradas contra datos reales de punto de
// venta de Jojutla. Los parámetros comerciales (contraprestación, arranque)
// sí son parametrizables — ver DEFAULTS y HANDOFF_CHICANITO_FRANCHISE.md §17.
//
// Cifras de control v2 (modelo de sociedad de capital): con DEFAULTS debe
// arrojar exactamente
//   capitalTrabajo = 554,573
//   inversion      = 3,359,573
//   payback        = mes 19 (acum del proyecto en calcular() cruza a cero
//                    el mismo mes que el payback del socio en cascada.js,
//                    porque el escalón 1 replica el 100% al 100% hasta ahí)
//   utilidadTotal  = 22,401,249
//   contraprestacion a 5 años = 1,901,763
//   ventas por año = 8,467,180 · 14,834,360 · 20,883,040 · 24,080,777 · 26,822,802
//   utilidades     = 1,774,388 · 3,568,583 · 5,268,337 · 6,131,021 · 6,858,920
//   margenes       = 21.0% · 24.1% · 25.2% · 25.5% · 25.6%

export const CONST = {
  desechablesPct: 0.024,
  serviciosBase: 204000,
  adminBase: 70200,
  motoOpAnual: 14200,
  foodCostJojutla: 0.3103,
};

export function calcular(v) {
  const ventaMotoAnual =
    v.pollosMotoDia * v.precioPaquete * v.diasMotoSemana * 52;

  const curva = [1, 1 + v.g, 0, 0, 0];
  curva[2] = curva[1] * (1 + v.g * 0.55);
  curva[3] = curva[2] * (1 + v.g * 0.15);
  curva[4] = curva[3] * (1 + v.g * 0.1);

  const anios = [];
  for (let i = 0; i < 5; i++) {
    const n = i + 1;
    const motosActivas = Math.min(n, v.motosTotales);
    const satelite = v.ventaAno1 * curva[i];
    const motos = motosActivas * ventaMotoAnual;
    const venta = satelite + motos;

    const producto = venta * (v.precioTransferencia / v.precioPaquete);
    const nomina = venta * (v.nominaPct / 100);
    const otros = venta * (v.otrosPct / 100);
    const desechables = venta * CONST.desechablesPct;
    const renta = v.rentaMensual * 12 * Math.pow(1.05, i);
    const servicios = CONST.serviciosBase * (1 + 0.15 * i);
    const motosOp = CONST.motoOpAnual * motosActivas;
    const admin = CONST.adminBase * (1 + 0.1 * i);
    const contraprestacion = venta * (v.operacionPct + v.marcaPct);

    const costos =
      producto +
      nomina +
      otros +
      desechables +
      renta +
      servicios +
      motosOp +
      admin +
      contraprestacion;
    const utilidad = venta - costos;

    anios.push({
      n,
      motosActivas,
      satelite,
      motos,
      venta,
      producto,
      nomina,
      otros,
      desechables,
      renta,
      servicios,
      motosOp,
      admin,
      contraprestacion,
      costos,
      utilidad,
      margen: venta > 0 ? utilidad / venta : 0,
    });
  }

  const deposito = v.rentaMensual * 3;
  const nominaMes1 = (anios[0].venta * (v.nominaPct / 100)) / 12;
  const capitalTrabajo =
    3 * (v.rentaMensual + nominaMes1 + CONST.serviciosBase / 12 + CONST.adminBase / 12);
  const inversion =
    v.arranqueMXN +
    v.equipoSatelite +
    v.adaptacion +
    (v.motosTotales >= 1 ? v.costoMotocarro : 0) +
    deposito +
    capitalTrabajo;

  let acum = -inversion;
  let payback = null;
  const serie = [];
  for (let m = 1; m <= 60; m++) {
    const aIdx = Math.floor((m - 1) / 12);
    const esInicioAnio = (m - 1) % 12 === 0;
    const anioNum = aIdx + 1;
    if (esInicioAnio && anioNum >= 2 && anioNum <= v.motosTotales) {
      acum -= v.costoMotocarro;
    }
    acum += anios[aIdx].utilidad / 12;
    serie.push(acum);
    if (payback === null && acum >= 0) payback = m;
  }

  const motosExtra = Math.max(0, v.motosTotales - 1) * v.costoMotocarro;
  const utilidadTotal = anios.reduce((s, a) => s + a.utilidad, 0) - motosExtra;
  const multiplo = inversion > 0 ? utilidadTotal / inversion : 0;

  return {
    anios,
    ventaMotoAnual,
    inversion,
    deposito,
    capitalTrabajo,
    payback,
    serie,
    utilidadTotal,
    multiplo,
    foodCostPct: v.precioTransferencia / v.precioPaquete,
  };
}

export const DEFAULTS = {
  ventaAno1: 7000000,
  g: 0.7,
  pollosMotoDia: 27,
  diasMotoSemana: 5,
  motosTotales: 5,
  precioPaquete: 209,
  precioTransferencia: 80,
  rentaMensual: 35000,
  nominaPct: 18,
  otrosPct: 10,
  operacionPct: 0.01,
  marcaPct: 0.01,
  arranqueMXN: 500000,
  equipoSatelite: 1500000,
  adaptacion: 400000,
  costoMotocarro: 300000,
};
