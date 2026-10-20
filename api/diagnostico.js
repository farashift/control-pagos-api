// GET /api/diagnostico — TEMPORAL: últimos intentos de pago y motivo de rechazo.
// Solo devuelve estado, motivo, medio, monto y fecha (sin datos del pagador). Se quita después.

const { tokenMP, llamarMP } = require('./_comun');

module.exports = async (req, res) => {
  if (!tokenMP()) return res.status(500).json({ error: 'Falta MP_ACCESS_TOKEN' });
  const pagos = await llamarMP('/v1/payments/search?sort=date_created&criteria=desc&limit=10');
  const cuenta = await llamarMP('/users/me');
  return res.status(200).json({
    cuenta: cuenta.ok ? {
      pais: cuenta.datos.site_id,
      tipo: cuenta.datos.user_type,
      estado: cuenta.datos.status && cuenta.datos.status.site_status,
      puedeCobrar: cuenta.datos.status && cuenta.datos.status.sell && cuenta.datos.status.sell.allow,
      motivosNoCobrar: cuenta.datos.status && cuenta.datos.status.sell && cuenta.datos.status.sell.codes,
    } : { error: cuenta.datos.message },
    intentos: pagos.ok ? (pagos.datos.results || []).map((p) => ({
      fecha: p.date_created,
      estado: p.status,
      motivo: p.status_detail,
      medio: p.payment_method_id,
      tipo: p.payment_type_id,
      monto: p.transaction_amount,
      referencia: p.external_reference,
    })) : { error: pagos.datos.message },
  });
};
