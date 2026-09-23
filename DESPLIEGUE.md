# Conectar la página publicada con el servidor

El proyecto de Vercel cuya raíz es `frontend` publica la interfaz. El backend Express debe ejecutarse también para iniciar sesión, leer Neon y procesar pagos.

El backend aún no tiene una URL pública configurada. Este documento prepara el despliegue; no significa que el servidor ya esté publicado.

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

La ruta pública `/health` devuelve 200 cuando el backend puede consultar PostgreSQL y 503 si no puede. No muestra credenciales. Configurar `TRUST_PROXY_HOPS` con el número de saltos de proxy que indique el alojamiento; mantener 0 localmente. No asumir que todas las cabeceras reenviadas son confiables.

Puede ejecutarse con el `Dockerfile` de `backend` (Node 24). Configurar las variables en el alojamiento y montar un volumen persistente en `/app/uploads`, con escritura para el usuario del contenedor (UID 1000). Alternativamente configurar `UPLOAD_DIR` con la ruta del volumen. `.dockerignore` excluye `.env` y los comprobantes locales de la imagen. No se ha construido la imagen Docker en esta entrega.

Los códigos de acceso del jefe se guardan como hashes en Neon y conservan el vencimiento, límite de cinco intentos y uso único tras reiniciar el servidor. Las sesiones se invalidan al cambiar contraseña o actualizar una cuenta. La limitación general de solicitudes aún es por proceso; usar una sola instancia inicialmente o configurar límites compartidos antes de escalar horizontalmente.

Preparar las estructuras aditivas con `npm run migrate` y verificar con `npm run check:db` y `npm run smoke`. No cargar otra vez los datos históricos sin conciliarlos. El comando de migración no importa el Excel.

## Comprobación real

Probar desde la URL pública: abrir `/login`, entrar con una cuenta de prueba, consultar cuotas, enviar un comprobante y revisarlo. Antes de probar escrituras contra la base real, seleccionar datos y operaciones expresamente destinados a esa prueba.

Que Vercel muestre Ready confirma la publicación del frontend; no comprueba por sí mismo la conexión de la API, Neon o el correo.
