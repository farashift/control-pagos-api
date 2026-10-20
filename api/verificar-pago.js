// GET /api/verificar-pago?id=<payment_id>
// Cuando Mercado Pago devuelve al usuario al sistema, este endpoint consulta el pago
// directamente a Mercado Pago (no se confía en lo que dice el link de regreso).

const { permitirOrigen, tokenMP, llamarMP } = require('./_comun');

module.exports = async (req, res) => {
  permitirOrigen(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido' });
  if (!tokenMP()) return res.status(500).json({ error: 'Falta configurar MP_ACCESS_TOKEN en Vercel.' });

  const id = String(req.query.id || '');
  if (!/^\d+$/.test(id)) return res.status(400).json({ error: 'N° de operación inválido.' });

  const { ok, estado, datos } = await llamarMP(`/v1/payments/${id}`);
  if (!ok) return res.status(estado === 404 ? 404 : 502).json({ error: datos.message || 'No se pudo consultar el pago.' });

  return res.status(200).json({
    operacion: String(datos.id),
    estado: datos.status,                 // approved, pending, in_process, rejected...
    detalle: datos.status_detail,
    referencia: datos.external_reference, // id del pago en Control de Pagos
    monto: datos.transaction_amount,
    moneda: datos.currency_id,
    fecha: datos.date_approved || datos.date_created,
    medio: datos.payment_method_id,       // visa, yape, account_money...
    tipo: datos.payment_type_id,          // credit_card, debit_card, account_money...
  });
};
