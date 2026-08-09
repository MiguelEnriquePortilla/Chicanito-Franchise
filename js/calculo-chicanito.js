// calculo-chicanito.js
// Motor de cálculo de la Guía del Inversionista — Chicanito CEDIS.
// Extraído textualmente del simulador validado. NO modificar las fórmulas:
// están calibradas contra datos reales de punto de venta de Jojutla.
//
// Cifras de control: con DEFAULTS debe arrojar exactamente
//   inversion      = 3,322,073
//   payback        = 22 meses
//   utilidadTotal  = 17,646,841
//   multiplo       = 5.31
//   ventas por año = 8,467,180 · 14,834,360 · 20,883,040 · 24,080,777 · 26,822,802
//   utilidades     = 1,351,029 · 2,826,865 · 4,224,185 · 4,926,982 · 5,517,780
//   margenes       = 16.0% · 19.1% · 20.2% · 20.5% · 20.6%

export const CONST = {
  desechablesPct: 0.024,
  regaliaPct: 0.06,
  publicidadPct: 0.01,
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
    const regalias = venta * (CONST.regaliaPct + CONST.publicidadPct);

    const costos =
      producto +
      nomina +
      otros +
      desechables +
      renta +
      servicios +
      motosOp +
      admin +
      regalias;
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
      regalias,
      costos,
      utilidad,
      margen: venta > 0 ? utilidad / venta : 0,
    });
  }

  const cuotaMXN = v.cuotaUSD * v.tipoCambio;
  const deposito = v.rentaMensual * 3;
  const nominaMes1 = (anios[0].venta * (v.nominaPct / 100)) / 12;
  const capitalTrabajo =
    3 * (v.rentaMensual + nominaMes1 + CONST.serviciosBase / 12 + CONST.adminBase / 12);
  const inversion =
    cuotaMXN +
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
    cuotaMXN,
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
  cuotaUSD: 25000,
  tipoCambio: 18.5,
  equipoSatelite: 1500000,
  adaptacion: 400000,
  costoMotocarro: 300000,
};
