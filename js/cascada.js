// cascada.js
// Distribuye la utilidad repartible mensual del proyecto (anios[] de
// calcular()) entre el socio inversionista y la operadora, en tres
// escalones. No modifica calculo-chicanito.js — lo consume.
//
// Corre mensual, no anual: el escalón 1 se cruza a mitad del año 2 (mes 19).
// La reinversión en motos se descuenta del pool antes de la cascada, con la
// misma lógica que ya usa calcular() para construir su serie. Cualquier
// déficit mensual (la reinversión deja el pool negativo) se arrastra al mes
// siguiente y se cubre antes de distribuir.

export const CASCADA_DEFAULTS = {
  escalon2Inv: 0.60,
  multiploPreferente: 2.0,
};

export function distribuir(anios, inversion, v, cfg = CASCADA_DEFAULTS) {
  const invMes = [];
  const opeMes = [];
  const invAcumMes = [];
  const escalonMes = [];

  let invAcum = 0;
  let deficit = 0;
  let payback = null;
  let hito2x = null;
  const topeEscalon2 = cfg.multiploPreferente * inversion;

  for (let m = 1; m <= 60; m++) {
    const aIdx = Math.floor((m - 1) / 12);
    const esInicioAnio = (m - 1) % 12 === 0;
    const anioNum = aIdx + 1;

    let pool = anios[aIdx].utilidad / 12;
    if (esInicioAnio && anioNum >= 2 && anioNum <= v.motosTotales) {
      pool -= v.costoMotocarro;
    }
    pool += deficit;
    deficit = 0;
    if (pool < 0) {
      deficit = pool;
      pool = 0;
    }

    let escalon = invAcum >= topeEscalon2 ? 3 : invAcum >= inversion ? 2 : 1;
    let invPortion = 0;
    let opePortion = 0;

    // Escalón 1 — 100% al socio hasta recuperar su capital.
    if (pool > 0 && invAcum < inversion) {
      const restante1 = inversion - invAcum;
      const usar1 = Math.min(pool, restante1);
      invPortion += usar1;
      invAcum += usar1;
      pool -= usar1;
      escalon = 1;
      if (invAcum >= inversion && payback === null) payback = m;
    }

    // Escalón 2 — 60% socio / 40% operadora, hasta 2x (multiploPreferente).
    if (pool > 0 && invAcum >= inversion && invAcum < topeEscalon2) {
      const faltante2 = topeEscalon2 - invAcum;
      const poolParaTope = faltante2 / cfg.escalon2Inv;
      const usarPool2 = Math.min(pool, poolParaTope);
      const usarInv2 = usarPool2 * cfg.escalon2Inv;
      const usarOpe2 = usarPool2 * (1 - cfg.escalon2Inv);
      invPortion += usarInv2;
      opePortion += usarOpe2;
      invAcum += usarInv2;
      pool -= usarPool2;
      escalon = 2;
      if (invAcum >= topeEscalon2 && hito2x === null) hito2x = m;
    }

    // Escalón 3 — 50/50 permanente.
    if (pool > 0 && invAcum >= topeEscalon2) {
      const usarInv3 = pool * 0.5;
      const usarOpe3 = pool * 0.5;
      invPortion += usarInv3;
      opePortion += usarOpe3;
      invAcum += usarInv3;
      pool = 0;
      escalon = 3;
    }

    invMes.push(invPortion);
    opeMes.push(opePortion);
    invAcumMes.push(invAcum);
    escalonMes.push(escalon);
  }

  const invTotal = invMes.reduce((s, x) => s + x, 0);
  const opeTotal = opeMes.reduce((s, x) => s + x, 0);

  return {
    invMes,
    opeMes,
    invAcumMes,
    escalonMes,
    invTotal,
    opeTotal,
    payback,
    hito2x,
    multiplo: inversion > 0 ? invTotal / inversion : 0,
  };
}
