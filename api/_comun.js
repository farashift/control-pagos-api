// Funciones compartidas por los endpoints de la API de Control de Pagos.

const ORIGENES_PERMITIDOS = [
  'https://farashift.github.io',
  'http://localhost:8768',
];

// Solo el sistema publicado (y el local de pruebas) puede llamar a la API desde el navegador
function permitirOrigen(req, res) {
  const origen = req.headers.origin;
  if (ORIGENES_PERMITIDOS.includes(origen)) {
    res.setHeader('Access-Control-Allow-Origin', origen);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

module.exports = { permitirOrigen };
