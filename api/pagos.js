// /api/pagos — base de datos compartida de los pagos (Upstash Redis en Vercel).
// GET  ?version=N  → si hubo cambios devuelve todos los pagos; si no, { sinCambios: true }
// POST { guardar: [pagos], borrar: [ids] } → aplica los cambios y sube la versión

const { permitirOrigen } = require('./_comun');

const URL_DB = (process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '').trim();
const TOKEN_DB = (process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '').trim();

async function redis(comandos) {
  const respuesta = await fetch(`${URL_DB}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN_DB}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(comandos),
  });
  const datos = await respuesta.json();
  if (!respuesta.ok) throw new Error(datos.error || 'Error en la base de datos');
  return datos.map((d) => d.result);
}

module.exports = async (req, res) => {
  permitirOrigen(req, res);
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (!URL_DB || !TOKEN_DB) return res.status(500).json({ error: 'Falta conectar la base de datos (Upstash) en Vercel.' });

  try {
    if (req.method === 'GET') {
      const [version, inicializado] = await redis([['GET', 'cp:version'], ['GET', 'cp:inicializado']]);
      const v = Number(version || 0);
      if (String(req.query.version) === String(v)) return res.status(200).json({ sinCambios: true, version: v });
      const [plano] = await redis([['HGETALL', 'cp:pagos']]);
      const pagos = [];
      for (let i = 1; i < (plano || []).length; i += 2) pagos.push(JSON.parse(plano[i]));
      return res.status(200).json({ version: v, inicializado: !!inicializado, pagos });
    }

    if (req.method === 'POST') {
      const { guardar = [], borrar = [] } = req.body || {};
      const comandos = [];
      for (const pago of guardar) {
        if (pago && pago.id) comandos.push(['HSET', 'cp:pagos', String(pago.id), JSON.stringify(pago)]);
      }
      for (const id of borrar) comandos.push(['HDEL', 'cp:pagos', String(id)]);
      comandos.push(['SET', 'cp:inicializado', '1']);
      comandos.push(['INCR', 'cp:version']);
      const resultados = await redis(comandos);
      return res.status(200).json({ ok: true, version: resultados[resultados.length - 1] });
    }

    return res.status(405).json({ error: 'Método no permitido' });
  } catch (error) {
    return res.status(502).json({ error: error.message });
  }
};
