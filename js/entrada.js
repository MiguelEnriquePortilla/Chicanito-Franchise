(function () {
  const form = document.getElementById('form-entrada');
  const input = document.getElementById('clave');
  const error = document.getElementById('entrada-error');
  const boton = document.getElementById('btn-entrar');

  const pasoClave = document.getElementById('paso-clave');
  const pasoConfid = document.getElementById('paso-confidencialidad');
  const confidCheck = document.getElementById('confid-check');
  const btnContinuar = document.getElementById('btn-continuar');

  async function entrar(code) {
    error.textContent = '';
    if (!code) return;

    boton.disabled = true;
    boton.textContent = 'Entrando…';

    try {
      const resp = await fetch('/api/validar-clave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ code }),
      });
      const data = await resp.json().catch(() => ({}));

      if (resp.ok && data.ok) {
        if (data.ndaAccepted) {
          window.location.href = '/guia.html';
        } else {
          pasoClave.hidden = true;
          pasoConfid.hidden = false;
        }
        return;
      }

      error.textContent = data.error || 'No pudimos validar tu clave. Intenta de nuevo.';
    } catch {
      error.textContent = 'Hubo un problema de conexión. Intenta de nuevo.';
    } finally {
      boton.disabled = false;
      boton.textContent = 'Entrar';
    }
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    entrar(input.value.trim());
  });

  const claveUrl = new URLSearchParams(window.location.search).get('clave');
  if (claveUrl) {
    const url = new URL(window.location.href);
    url.searchParams.delete('clave');
    history.replaceState({}, '', url.pathname + url.search + url.hash);
    input.value = claveUrl;
    entrar(claveUrl.trim());
  }

  confidCheck.addEventListener('change', () => {
    btnContinuar.disabled = !confidCheck.checked;
  });

  btnContinuar.addEventListener('click', async () => {
    btnContinuar.disabled = true;
    btnContinuar.textContent = 'Un momento…';
    try {
      const resp = await fetch('/api/aceptar-terminos', {
        method: 'POST',
        credentials: 'include',
      });
      if (resp.ok) {
        window.location.href = '/guia.html';
        return;
      }
    } catch {
      // sigue al mensaje de abajo
    }
    btnContinuar.disabled = false;
    btnContinuar.textContent = 'Continuar al documento';
  });
})();
