import { montarSimulador } from './simulador.js';
import {
  iniciarSeguimientoBloques,
  iniciarTemporizador,
  registrarCambioSlider,
  actualizarEscenarioFinal,
  registrarFormularioAbierto,
  registrarFormularioEnviado,
} from './telemetria.js';

const cargando = document.getElementById('guia-cargando');
const contenido = document.getElementById('guia-contenido');

function mostrarError() {
  window.location.href = '/index.html';
}

function conectarSimulador(tipoCambio) {
  const root = document.getElementById('simulador-root');
  if (!root) return;
  const sim = montarSimulador(root, tipoCambio);
  sim.onCambio((clave, valor) => {
    registrarCambioSlider(clave, valor);
    actualizarEscenarioFinal(sim.obtenerEscenario());
  });
  actualizarEscenarioFinal(sim.obtenerEscenario());
}

function conectarFormulario() {
  const form = document.getElementById('form-solicitud');
  if (!form) return;
  const mensaje = form.querySelector('.form-mensaje');
  let abiertoRegistrado = false;

  form.addEventListener('focusin', () => {
    if (!abiertoRegistrado) {
      abiertoRegistrado = true;
      registrarFormularioAbierto();
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    mensaje.textContent = '';
    mensaje.className = 'form-mensaje';

    if (form.empresa.value) return; // honeypot: bots lo llenan, humanos no lo ven

    const boton = form.querySelector('button[type="submit"]');
    boton.disabled = true;

    const datos = {
      nombre: form.nombre.value.trim(),
      telefono: form.telefono.value.trim(),
      correo: form.correo.value.trim(),
      ciudad: form.ciudad.value.trim(),
      capital_rango: form.capital_rango.value,
      como_nos_conociste: form.como.value.trim(),
      consentimiento: form.consentimiento.checked,
    };

    try {
      const resp = await fetch('/api/solicitud', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(datos),
      });
      const data = await resp.json().catch(() => ({}));

      if (resp.ok && data.ok) {
        mensaje.textContent = 'Recibido. Te llamamos en menos de 24 horas para agendar tu visita a Jojutla.';
        mensaje.classList.add('ok');
        form.reset();
        registrarFormularioEnviado();
      } else {
        mensaje.textContent = data.error || 'No pudimos enviar tu solicitud. Intenta de nuevo.';
        mensaje.classList.add('error');
      }
    } catch {
      mensaje.textContent = 'Hubo un problema de conexión. Intenta de nuevo.';
      mensaje.classList.add('error');
    } finally {
      boton.disabled = false;
    }
  });
}

async function iniciar() {
  let resp;
  try {
    resp = await fetch('/api/guia', { credentials: 'include' });
  } catch {
    mostrarError();
    return;
  }

  if (!resp.ok) {
    mostrarError();
    return;
  }

  const data = await resp.json();
  contenido.innerHTML = data.html;
  cargando.hidden = true;
  contenido.hidden = false;

  conectarSimulador(data.tipoCambio);
  conectarFormulario();
  iniciarSeguimientoBloques(contenido);
  iniciarTemporizador();
}

iniciar();
