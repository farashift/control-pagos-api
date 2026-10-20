# API de Control de Pagos (Culqi)

Servidor mínimo para la HU-08 del sistema [Control de Pagos](https://farashift.github.io/control-pagos/).

| Endpoint | Qué hace |
|----------|----------|
| `POST /api/culqi-cargo` | Recibe el token de tarjeta que genera el formulario de Culqi y hace el cobro con la llave secreta |

## Configuración en Vercel

Variable de entorno `CULQI_SECRET_KEY` con la llave secreta de Culqi (`sk_test_…` para pruebas, `sk_live_…` para cobros reales).
La llave secreta nunca se guarda en el código ni llega al navegador.
