# Conectar la página publicada con el servidor

El proyecto de Vercel cuya raíz es `frontend` publica la interfaz. El backend Express debe ejecutarse también para iniciar sesión, leer Neon y procesar pagos.

## Interfaz en Vercel

- Root Directory: `frontend`, exactamente en minúsculas.
- Build Command: `npm run build`; Output Directory: `dist`.
- Configurar `VITE_API_URL` con la dirección HTTPS pública del backend, sin `/api` al final, y reconstruir el frontend.
- `vercel.json` permite abrir directamente `/login` y los paneles, siguiendo la [documentación de Vercel para Vite](https://vercel.com/docs/frameworks/frontend/vite).
- Nunca poner `DATABASE_URL`, contraseñas o `JWT_SECRET` en variables que empiecen por `VITE_`.

## Servidor Express

Ejecutar desde `backend`: instalar con `npm ci` y arrancar con `npm start`. El servicio debe disponer de almacenamiento persistente para `backend/uploads`, donde se guardan los comprobantes. No se debe usar almacenamiento efímero para esos archivos.

Configurar en el servidor `DATABASE_URL`, `JWT_SECRET` y `FRONTEND_ORIGINS`. Esta última debe incluir el origen exacto de la página, por ejemplo `https://pagina-web-psi-two.vercel.app`, y cualquier dominio propio utilizado. El `PORT` puede proporcionarlo el alojamiento.

Configurar SMTP (`MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASS`, `MAIL_FROM`) para el código de acceso del jefe. Definir opcionalmente los datos públicos `CLUB_TELEFONO`, `CLUB_CORREO` y `CLUB_DIRECCION`.

Preparar las estructuras aditivas con `npm run migrate` y verificar con `npm run check:db` y `npm run smoke`. No cargar otra vez los datos históricos sin conciliarlos. El comando de migración no importa el Excel.

## Comprobación real

Probar desde la URL pública: abrir `/login`, entrar con una cuenta de prueba, consultar cuotas, enviar un comprobante y revisarlo. Antes de probar escrituras contra la base real, seleccionar datos y operaciones expresamente destinados a esa prueba.

Que Vercel muestre Ready confirma la publicación del frontend; no comprueba por sí mismo la conexión de la API, Neon o el correo.
