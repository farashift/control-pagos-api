// POST /api/crear-preferencia
// Recibe el pago que la asistente quiere pagar y crea el checkout en Mercado Pago.
// Devuelve el link (init_point) al que el sistema redirige para pagar.

const { permitirOrigen, tokenMP, llamarMP } = require('./_comun');

const VOLVER_A = 'https://farashift.github.io/control-pagos/';

module.exports = async (req, res) => {
  permitirOrigen(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });
  if (!tokenMP()) return res.status(500).json({ error: 'Falta configurar MP_ACCESS_TOKEN en Vercel.' });

  const { id, beneficiario, concepto, monto, volverA } = req.body || {};
  const precio = Math.round(Number(monto) * 100) / 100;
  if (!id || !(precio > 0)) return res.status(400).json({ error: 'Datos del pago incompletos.' });

  // Solo se permite volver al sistema publicado o al local de pruebas
  const regreso = typeof volverA === 'string' && /^(https:\/\/farashift\.github\.io\/control-pagos\/|http:\/\/localhost:8768\/)/.test(volverA)
    ? volverA
    : VOLVER_A;

  const { ok, datos } = await llamarMP('/checkout/preferences', {
    method: 'POST',
    body: JSON.stringify({
      items: [{
        id: String(id),
        title: `${beneficiario || 'Pago'} - ${concepto || ''}`.slice(0, 250),
        quantity: 1,
        currency_id: 'PEN',
        unit_price: precio,
      }],
      external_reference: String(id),
      back_urls: { success: regreso, failure: regreso, pending: regreso },
      auto_return: 'approved',
      statement_descriptor: 'CONTROL PAGOS',
    }),
  });

  if (!ok) return res.status(502).json({ error: datos.message || 'Mercado Pago rechazó la solicitud.' });

  const esPrueba = tokenMP().startsWith('TEST-');
  return res.status(200).json({
    preferencia: datos.id,
    link: esPrueba ? datos.sandbox_init_point : datos.init_point,
    prueba: esPrueba,
  });
};
