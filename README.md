# API de Control de Pagos (Mercado Pago)

Servidor mínimo para la HU-08 del sistema [Control de Pagos](https://farashift.github.io/control-pagos/).
Guarda en secreto el token de Mercado Pago y hace dos cosas:

| Endpoint | Qué hace |
|----------|----------|
| `POST /api/crear-preferencia` | Crea el checkout de Mercado Pago para un pago y devuelve el link para pagar |
| `GET /api/verificar-pago?id=…` | Consulta a Mercado Pago el estado real de un pago al volver al sistema |

## Configuración en Vercel

1. Importar este repositorio en Vercel.
2. Agregar la variable de entorno `MP_ACCESS_TOKEN` con el *Access Token* de Mercado Pago Developers
   (`TEST-…` para pruebas, `APP_USR-…` para cobros reales).
3. Deploy.

El token nunca se guarda en el código ni llega al navegador.
