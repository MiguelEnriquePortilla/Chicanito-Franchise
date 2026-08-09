// Notificaciones a Miguel por correo, vía la API REST de Resend (fetch nativo,
// sin dependencia extra). Si RESEND_API_KEY no está configurada, no truena:
// se queda en silencio, igual que el guardado en base de datos en chicanito-app.
async function notificarMiguel(asunto, textoHtml) {
  const apiKey = process.env.RESEND_API_KEY;
  const destinatario = process.env.NOTIFY_EMAIL || 'miguel.e.portilla@gmail.com';
  const remitente = process.env.NOTIFY_FROM || 'Guía del Inversionista <onboarding@resend.dev>';
  if (!apiKey) return { sent: false, reason: 'RESEND_API_KEY no configurada' };

  try {
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: remitente,
        to: [destinatario],
        subject: asunto,
        html: textoHtml,
      }),
    });
    if (!resp.ok) return { sent: false, reason: `Resend respondió ${resp.status}` };
    return { sent: true };
  } catch (e) {
    return { sent: false, reason: String(e) };
  }
}

module.exports = { notificarMiguel };
