// POST /api/culqi-cargo
// El navegador abre el formulario de Culqi, Culqi devuelve un token de la tarjeta (tkn_...)
// y este endpoint hace el cobro con la llave secreta, que vive solo en Vercel (CULQI_SECRET_KEY).

const { permitirOrigen } = require('./_comun');

module.exports = async (req, res) => {
  permitirOrigen(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  const llave = (process.env.CULQI_SECRET_KEY || '').trim();
  if (!llave) return res.status(500).json({ error: 'Falta configurar CULQI_SECRET_KEY en Vercel.' });

  const { token, email, monto, id, beneficiario, concepto } = req.body || {};
  const centimos = Math.round(Number(monto) * 100);
  if (!token || !email || !id || !(centimos >= 100)) {
    return res.status(400).json({ error: 'Datos del pago incompletos.' });
  }

  // Culqi pide una descripción de 5 a 80 caracteres
  const descripcion = `${beneficiario || 'Pago'} - ${concepto || ''}`.slice(0, 80).padEnd(5, '.');

  const respuesta = await fetch('https://api.culqi.com/v2/charges', {
    method: 'POST',
    headers: { Authorization: `Bearer ${llave}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: centimos,
      currency_code: 'PEN',
      email,
      source_id: token,
      description: descripcion,
      metadata: { pago_id: String(id) },
    }),
  });
  const cargo = await respuesta.json().catch(() => ({}));

  if (!respuesta.ok || cargo.object === 'error') {
    return res.status(402).json({
      error: cargo.user_message || cargo.merchant_message || 'Culqi no pudo procesar el pago.',
      codigo: cargo.decline_code || cargo.code || cargo.type || '',
    });
  }

  const tarjeta = cargo.source && cargo.source.iin;
  return res.status(200).json({
    operacion: cargo.id,
    referencia: String(id),
    monto: cargo.amount / 100,
    fecha: new Date(cargo.creation_date || Date.now()).toISOString(),
    medio: [tarjeta && tarjeta.card_brand, cargo.source && cargo.source.last_four && `•••• ${cargo.source.last_four}`]
      .filter(Boolean).join(' ') || (String(token).startsWith('ype_') ? 'Yape' : 'Tarjeta'),
    mensaje: (cargo.outcome && cargo.outcome.user_message) || 'Pago realizado',
    prueba: llave.startsWith('sk_test'),
  });
};
