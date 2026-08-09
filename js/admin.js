(function () {
  const TOKEN_KEY = 'inv_admin_token';

  const loginView = document.getElementById('admin-login');
  const panelView = document.getElementById('admin-panel');
  const loginForm = document.getElementById('form-admin-login');
  const loginError = document.getElementById('admin-login-error');

  function token() {
    return sessionStorage.getItem(TOKEN_KEY) || '';
  }

  async function apiFetch(path, options = {}) {
    const resp = await fetch(path, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${token()}`,
      },
    });
    if (resp.status === 401) {
      sessionStorage.removeItem(TOKEN_KEY);
      mostrarLogin();
      throw new Error('No autorizado');
    }
    return resp;
  }

  function mostrarLogin() {
    loginView.hidden = false;
    panelView.hidden = true;
  }

  function mostrarPanel() {
    loginView.hidden = true;
    panelView.hidden = false;
    cargarClaves();
    cargarActividad();
    cargarLeads();
    cargarTipoCambio();
  }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.textContent = '';
    const val = document.getElementById('admin-token').value.trim();
    sessionStorage.setItem(TOKEN_KEY, val);
    try {
      const resp = await apiFetch('/api/admin/claves');
      if (!resp.ok) throw new Error();
      mostrarPanel();
    } catch {
      loginError.textContent = 'Clave incorrecta';
      sessionStorage.removeItem(TOKEN_KEY);
    }
  });

  // ---------- Tabs ----------
  document.querySelectorAll('.admin-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.admin-tab').forEach((t) => t.classList.remove('activa'));
      document.querySelectorAll('.admin-seccion').forEach((s) => (s.hidden = true));
      tab.classList.add('activa');
      document.querySelector(`.admin-seccion[data-panel="${tab.dataset.tab}"]`).hidden = false;
    });
  });
  document.querySelector('.admin-tab')?.classList.add('activa');

  // ---------- Claves ----------
  function estadoClave(c) {
    if (!c.active) return { texto: 'Revocada', clase: 'badge--revocada' };
    if (new Date(c.expires_at) < new Date()) return { texto: 'Vencida', clase: 'badge--vencida' };
    return { texto: 'Activa', clase: 'badge--activa' };
  }

  async function cargarClaves() {
    const tbody = document.querySelector('#tabla-claves tbody');
    tbody.innerHTML = '<tr><td colspan="8">Cargando…</td></tr>';
    try {
      const resp = await apiFetch('/api/admin/claves');
      const data = await resp.json();
      if (!data.claves.length) {
        tbody.innerHTML = '<tr><td colspan="8">Sin claves todavía</td></tr>';
        return;
      }
      tbody.innerHTML = data.claves.map((c) => {
        const estado = estadoClave(c);
        return `
          <tr>
            <td>${c.code}</td>
            <td>${c.prospect_name || '—'}</td>
            <td><span class="badge ${estado.clase}">${estado.texto}</span></td>
            <td>${new Date(c.expires_at).toLocaleDateString('es-MX')}</td>
            <td>${c.view_count}</td>
            <td>${c.last_seen_at ? new Date(c.last_seen_at).toLocaleString('es-MX') : '—'}</td>
            <td>${c.nda_accepted_at ? new Date(c.nda_accepted_at).toLocaleDateString('es-MX') : '—'}</td>
            <td>${c.active ? `<button class="link-revocar" data-code="${c.code}">Revocar</button>` : ''}</td>
          </tr>`;
      }).join('');

      tbody.querySelectorAll('.link-revocar').forEach((btn) => {
        btn.addEventListener('click', async () => {
          if (!confirm(`¿Revocar la clave ${btn.dataset.code}? El acceso se bloquea de inmediato.`)) return;
          await apiFetch('/api/admin/revocar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: btn.dataset.code, active: false }),
          });
          cargarClaves();
        });
      });
    } catch {
      tbody.innerHTML = '<tr><td colspan="7">Error al cargar</td></tr>';
    }
  }

  document.getElementById('form-nueva-clave').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const mensaje = document.getElementById('mensaje-nueva-clave');
    mensaje.textContent = '';
    mensaje.className = 'admin-mensaje';

    const body = {
      code: form.code.value,
      prospect_name: form.prospect_name.value || null,
      prospect_phone: form.prospect_phone.value || null,
      notes: form.notes.value || null,
      expires_at: form.expires_at.value,
    };

    try {
      const resp = await apiFetch('/api/admin/claves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await resp.json();
      if (resp.ok) {
        mensaje.textContent = 'Clave creada.';
        mensaje.classList.add('ok');
        form.reset();
        cargarClaves();
      } else {
        mensaje.textContent = data.error || 'Error al crear la clave';
        mensaje.classList.add('error');
      }
    } catch {
      mensaje.textContent = 'Error de conexión';
      mensaje.classList.add('error');
    }
  });

  // ---------- Actividad ----------
  async function cargarActividad() {
    const tbody = document.querySelector('#tabla-actividad tbody');
    tbody.innerHTML = '<tr><td colspan="5">Cargando…</td></tr>';
    try {
      const resp = await apiFetch('/api/admin/actividad');
      const data = await resp.json();
      if (!data.resumen.length) {
        tbody.innerHTML = '<tr><td colspan="5">Sin actividad todavía</td></tr>';
        return;
      }
      tbody.innerHTML = data.resumen.map((r) => {
        const sesion = r.ultima_sesion || {};
        const minutos = sesion.segundosEnPagina ? Math.round(sesion.segundosEnPagina / 60) : null;
        const escenario = sesion.escenarioFinal;
        const escenarioTexto = escenario
          ? `${escenario.valores.motosTotales} móviles · payback ${escenario.payback ?? '—'} m · ${escenario.multiplo.toFixed(2)}x`
          : '—';
        return `
          <tr>
            <td>${r.code}${r.prospect_name ? ` (${r.prospect_name})` : ''}</td>
            <td>${r.first_seen_at ? 'Sí' : 'No'}</td>
            <td>${minutos !== null ? `${minutos} min` : '—'}</td>
            <td>${sesion.ultimoBloque || '—'}</td>
            <td>${escenarioTexto}</td>
          </tr>`;
      }).join('');
    } catch {
      tbody.innerHTML = '<tr><td colspan="5">Error al cargar</td></tr>';
    }
  }

  // ---------- Leads ----------
  async function cargarLeads() {
    const tbody = document.querySelector('#tabla-leads tbody');
    tbody.innerHTML = '<tr><td colspan="7">Cargando…</td></tr>';
    try {
      const resp = await apiFetch('/api/admin/leads');
      const data = await resp.json();
      if (!data.leads.length) {
        tbody.innerHTML = '<tr><td colspan="7">Sin solicitudes todavía</td></tr>';
        return;
      }
      tbody.innerHTML = data.leads.map((l) => `
        <tr>
          <td>${new Date(l.creado_en).toLocaleString('es-MX')}</td>
          <td>${l.nombre}</td>
          <td>${l.telefono}</td>
          <td>${l.correo}</td>
          <td>${l.ciudad}</td>
          <td>${l.capital_rango || '—'}</td>
          <td>${l.code || '—'}</td>
        </tr>`).join('');
    } catch {
      tbody.innerHTML = '<tr><td colspan="7">Error al cargar</td></tr>';
    }
  }

  // ---------- Tipo de cambio ----------
  async function cargarTipoCambio() {
    try {
      const resp = await apiFetch('/api/admin/tipo-cambio');
      const data = await resp.json();
      document.querySelector('#form-tipo-cambio input[name="tipoCambio"]').value = data.tipoCambio;
    } catch {
      // silencioso, el form se queda vacío
    }
  }

  document.getElementById('form-tipo-cambio').addEventListener('submit', async (e) => {
    e.preventDefault();
    const mensaje = document.getElementById('mensaje-tipo-cambio');
    mensaje.textContent = '';
    mensaje.className = 'admin-mensaje';
    const valor = e.target.tipoCambio.value;
    try {
      const resp = await apiFetch('/api/admin/tipo-cambio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipoCambio: valor }),
      });
      if (resp.ok) {
        mensaje.textContent = 'Actualizado.';
        mensaje.classList.add('ok');
      } else {
        mensaje.textContent = 'Error al guardar';
        mensaje.classList.add('error');
      }
    } catch {
      mensaje.textContent = 'Error de conexión';
      mensaje.classList.add('error');
    }
  });

  // ---------- Arranque ----------
  if (token()) {
    apiFetch('/api/admin/claves').then((resp) => {
      if (resp.ok) mostrarPanel();
    }).catch(() => {});
  }
})();
