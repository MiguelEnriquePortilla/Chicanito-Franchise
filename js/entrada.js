(function () {
  const form = document.getElementById('form-entrada');
  const input = document.getElementById('clave');
  const error = document.getElementById('entrada-error');
  const boton = document.getElementById('btn-entrar');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    error.textContent = '';
    const code = input.value.trim();
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
        window.location.href = '/guia.html';
        return;
      }

      error.textContent = data.error || 'No pudimos validar tu clave. Intenta de nuevo.';
    } catch {
      error.textContent = 'Hubo un problema de conexión. Intenta de nuevo.';
    } finally {
      boton.disabled = false;
      boton.textContent = 'Entrar';
    }
  });
})();
