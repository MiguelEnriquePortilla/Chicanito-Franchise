// Telemetría — sección 7 del brief. Cada evento va ligado al `code` del
// prospecto vía la cookie de sesión (el servidor la lee, nunca se manda el
// code desde el cliente). Los envíos "en vivo" usan fetch; los que pueden
// coincidir con que el usuario cierre la pestaña usan sendBeacon.
function enviar(tipo, payload) {
  fetch('/api/evento', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    keepalive: true,
    body: JSON.stringify({ tipo, payload }),
  }).catch(() => {});
}

function enviarBeacon(tipo, payload) {
  try {
    const blob = new Blob([JSON.stringify({ tipo, payload })], { type: 'application/json' });
    if (navigator.sendBeacon && navigator.sendBeacon('/api/evento', blob)) return;
  } catch {
    // sigue al fallback de abajo
  }
  enviar(tipo, payload);
}

let inicioMs = null;
let ultimoBloque = null;
let ultimoEscenario = null;
let salidaRegistrada = false;

export function iniciarSeguimientoBloques(container) {
  const bloques = container.querySelectorAll('.bloque[id]');
  if (!('IntersectionObserver' in window) || bloques.length === 0) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) ultimoBloque = entry.target.id;
    });
  }, { threshold: 0.4 });

  bloques.forEach((b) => observer.observe(b));
}

const debounces = {};
export function registrarCambioSlider(clave, valor) {
  clearTimeout(debounces[clave]);
  debounces[clave] = setTimeout(() => {
    enviar('variable_cambio', { clave, valor });
  }, 500);
}

export function actualizarEscenarioFinal(escenario) {
  ultimoEscenario = escenario;
}

export function registrarFormularioAbierto() {
  enviar('form_abierto', {});
}

export function registrarFormularioEnviado() {
  enviar('form_enviado', {});
}

export function iniciarTemporizador() {
  inicioMs = Date.now();

  const registrarSalida = () => {
    if (salidaRegistrada) return;
    salidaRegistrada = true;
    const segundos = Math.round((Date.now() - inicioMs) / 1000);
    enviarBeacon('sesion_fin', {
      segundosEnPagina: segundos,
      ultimoBloque,
      escenarioFinal: ultimoEscenario,
    });
  };

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') registrarSalida();
  });
  window.addEventListener('pagehide', registrarSalida);
}
