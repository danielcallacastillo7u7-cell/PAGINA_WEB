# Revisión del sistema Club Catarindo — 18 de septiembre de 2026

## Diagnóstico confirmado

El repositorio no tenía `backend/.env` y el proceso tampoco tenía `DATABASE_URL` configurado. `pg` podía usar su destino por defecto (localhost:5432). Se creó el archivo local con la conexión proporcionada y un secreto JWT aleatorio. La conexión TLS a Neon se comprobó correctamente. Los secretos quedan excluidos de Git.

Además, Neon tenía el esquema antiguo: `usuarios`, `socio_detalles`, `cuotas`, `pagos` y `movimientos`. El backend nuevo consultaba tablas inexistentes. Se aplicó `backend/migrations/001_club.sql`: crea `importaciones_excel`, `socios_club`, `cuotas_club`, `pagos_cuotas` y `movimientos_financieros`. No se cambiaron ni eliminaron registros o tablas anteriores. Las consultas nuevas usan `cuotas_club` para evitar confundirlas con las cuotas antiguas.

## Correcciones

- Configuración cargada desde la carpeta del backend, independiente del directorio de ejecución; validación temprana de URL/JWT y conexión al arrancar; verificación TLS habilitada.
- JWT verificado por el servidor, consulta del rol y estado actual de la cuenta en cada solicitud, control de roles en todas las rutas de negocio y protección de paneles en React.
- Registro cerrado al público. Admin solo crea usuarios; jefe puede crear roles administrativos. Se mantiene el segundo paso de acceso del jefe; códigos aleatorios criptográficos, vencimiento y límite de intentos.
- Ruta de finanzas montada. Cliente HTTP común envía Bearer token; Vite redirige `/api` al backend. `VITE_API_URL` permite separar servidores en un despliegue.
- Imports y nombres de dashboard.jsx y sociodetalle.jsx alineados con los nombres registrados en Git; no se detectaron otros imports locales faltantes.
- Panel del contador conectado a los módulos reales; eliminados los importes ficticios de esa pantalla.
- Comprobantes del modelo antiguo disponibles en `/api/solicitudes`, con autorización del propietario, límite de tamaño, validación de imagen y descarga autenticada. No se expone públicamente `uploads`, que contenía incluso un archivo JavaScript antiguo.
- El formulario de socio usa la identidad del JWT. El administrador mantiene la revisión de solicitudes antiguas; su historial ahora muestra pagos reales en vez de texto de ejemplo.
- Validación de montos finitos y positivos, rechazo de reaprobación de pagos ya revisados y bloqueo de la cuota antes de sumar pagos concurrentes.
- Dashboard nuevo incluye pagos aprobados de cuotas, igual que los reportes nuevos.
- Importación Excel en memoria con límite de 10 MB, corrección de prefijo monetario y encabezado DIRECCIÓN; bloqueo transaccional de reimportación con el mismo nombre y rechazo de importación vacía.

## Permisos aplicados

| Módulo | Roles |
|---|---|
| Cuentas de usuarios | jefe, admin |
| Padrón de socios | jefe, admin |
| Cuotas nuevas | jefe, contador |
| Pagos de cuotas | jefe, admin, contador |
| Finanzas, dashboard y reportes | jefe, contador |
| Importación histórica | jefe |
| Solicitudes antiguas | usuario: propias; jefe/admin/contador: revisión |

Estos permisos reflejan los paneles existentes; revisar si el club requiere separar registro y aprobación de pagos entre personas distintas.

## Validación realizada

- Compilación de producción del frontend: correcta.
- 11 pruebas automáticas HTTP: autorización, registro, rol real frente al JWT, cuenta inactiva, aislamiento de historial, validación y acceso a archivos.
- Comprobación de tablas, columnas y restricciones en Neon: correcta para los módulos actuales.
- 18 comprobaciones HTTP de solo lectura con Neon, incluido historial propio y exportación Excel de 14 hojas: correctas. Las pruebas usan tokens temporales internos y no prueban la contraseña del usuario ni envían correo.
- Lint: quedan 7 errores y 2 advertencias de efectos/dependencias React en componentes existentes. No impiden la compilación; necesitan limpieza de ciclos de carga y actualización. No se desactivaron reglas para ocultarlos.
- No se probaron altas, aprobación de pagos ni importación contra datos reales, para no introducir registros de prueba.

## Pendientes prioritarios

1. **Correo del jefe:** completar `MAIL_USER`, `MAIL_PASS` y, si corresponde, `MAIL_HOST`, `MAIL_PORT` y `MAIL_FROM` en `backend/.env`. El inicio de sesión de jefe mantiene su verificación por correo y fallará hasta configurar SMTP. No se cambió ninguna contraseña de usuario.
2. **Conciliar el padrón y la contabilidad:** las tablas nuevas están vacías. Importar el Excel histórico real después de validar su vista previa; vincular `socios_club.usuario_id` con las cuentas correctas. No se inferieron identidades ni se copiaron pagos automáticamente. Las solicitudes antiguas no se suman automáticamente a los reportes nuevos; hacerlo sin conciliación puede duplicar ingresos.
3. **Reglas contables y migración:** validar abonos parciales (los resúmenes de deuda todavía consideran el monto completo de cuotas no saldadas), sobrepagos, conciliación de comprobantes con cuotas nuevas y reversos con auditoría. La importación impide repetir nombres, pero un archivo renombrado o con movimientos solapados aún puede duplicar datos. Falta probar el formato del Excel real; el exportador y el importador no son un ciclo de ida/vuelta garantizado.
4. **Funciones incompletas:** avisos del socio, formulario público de contacto, botones de detalles de servicios y datos reales de contacto. Falta una interfaz para vincular cuentas/padrón y registrar/modificar socios del padrón sin Excel. Limpiar las incidencias React señaladas antes del despliegue.
5. **Configuración de producción:** rotar la contraseña Neon compartida en el chat y actualizar `.env`; persistencia compartida para códigos/límites si hay varios procesos; respaldo de comprobantes, HTTPS y configuración del proxy/orígenes. No hay cuenta contador activa en la inspección realizada.

## Ejecución local

En `backend`: `npm run dev`. En `frontend`: `npm run dev`; abrir http://localhost:5173.

Comprobación de esquema: `npm run check:db` en backend. Pruebas aisladas: `npm test`. El arranque no ejecuta migraciones ni importa datos automáticamente.

Las correcciones quedan locales, sin commit ni push. Se guardó respaldo de archivos reemplazados fuera del repositorio.

