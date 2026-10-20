// Funciones compartidas por los endpoints de la API de Control de Pagos.
// El token de Mercado Pago vive SOLO aquí, en la variable de entorno MP_ACCESS_TOKEN de Vercel:
// nunca llega al navegador ni al repositorio.

const ORIGENES_PERMITIDOS = [
  'https://farashift.github.io',
  'http://localhost:8768',
];

function permitirOrigen(req, res) {
  const origen = req.headers.origin;
  if (ORIGENES_PERMITIDOS.includes(origen)) {
    res.setHeader('Access-Control-Allow-Origin', origen);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function tokenMP() {
  return (process.env.MP_ACCESS_TOKEN || '').trim();
}

async function llamarMP(ruta, opciones = {}) {
  const respuesta = await fetch('https://api.mercadopago.com' + ruta, {
    ...opciones,
    headers: {
      Authorization: `Bearer ${tokenMP()}`,
      'Content-Type': 'application/json',
      ...(opciones.headers || {}),
    },
  });
  const datos = await respuesta.json().catch(() => ({}));
  return { ok: respuesta.ok, estado: respuesta.status, datos };
}

module.exports = { permitirOrigen, tokenMP, llamarMP };
