# Club Catarindo: estado local, 22 de septiembre de 2026

## Corregido y conectado

- Padrón editable y vínculo entre propiedades y cuentas de socios.
- Cuotas personales, envío de comprobantes y revisión administrativa.
- Pagos parciales: saldo real, reserva de importes pendientes, rechazo de sobrepagos y doble aprobación. Anulación por jefe con motivo y auditoría.
- Anulación financiera sin borrar el movimiento original; dashboard y reportes excluyen movimientos anulados.
- Avisos, bandeja de contacto y solicitudes de reserva con revisión de horarios superpuestos. Las reservas no cobran ni fijan tarifas automáticamente.
- Cierre de sesión y menús móviles de los cuatro roles. Frontend compila y pasa ESLint.
- Importador histórico: reconoce IMPORTE, fechas cortas y hojas con filas vacías; excluye SALDO/TOTAL; evita reimportar el mismo contenido incluso renombrado. Conserva filas idénticas dentro del libro y avisa de ellas.

Se mantiene la configuración Neon en `backend/.env`, ignorada por Git. La carga es independiente del directorio de ejecución y verifica TLS. Los secretos no forman parte de esta documentación.

## Excel real

`JUNIO 2026.xlsx` contiene hojas de 2025 y 2026. El análisis detecta 50 socios con cuota válida, 954 movimientos candidatos y 41 advertencias: cuotas base vacías, fechas/importes inválidos y diferencias contra totales del libro. La pantalla exige revisar y aceptar las advertencias antes de confirmar. El archivo real no se importó automáticamente.

La importación registra padrón y movimientos; no reconstruye deudas históricas ni asigna cobros a cuotas. Los reportes muestran la diferencia de movimientos registrados, que requiere conciliar un saldo inicial para equivaler al saldo bancario. Las importaciones anteriores sin huella necesitan conciliación antes de cargar de nuevo sus libros.

Los comprobantes del modelo anterior permanecen en una sección separada; no se suman automáticamente a los reportes nuevos, para evitar duplicar ingresos.

## Roles

| Función | Acceso |
|---|---|
| Padrón y cuentas de socios | jefe, admin |
| Cuotas | jefe, contador |
| Revisión de pagos | jefe, admin, contador |
| Finanzas, dashboard y reportes | jefe, contador |
| Importación histórica y anulaciones | jefe |
| Gestión de avisos y mensajes | jefe, admin |
| Reservas | usuario: propias; jefe/admin: revisión |
| Portal personal | usuario: propiedades vinculadas |

El servidor verifica el estado y rol actual de la cuenta en cada solicitud. El jefe conserva la verificación por correo: requiere configurar SMTP, sin omitir ese paso.

## Validación

20 pruebas automatizadas y 48 comprobaciones HTTP con PostgreSQL local aislado: migraciones, abonos, autorización, reservas superpuestas, anulaciones, importación y reporte de 14 hojas. Los bloqueos consultivos se simulan en ese motor de pruebas; no se ha realizado una prueba de carga concurrente contra Neon. Se comprobaron las pantallas en navegador de escritorio y móvil con datos ficticios. Las pruebas de escritura no usan los datos reales.

`002_flujo.sql` agrega auditoría, avisos, contacto, reservas, saldos y huellas al esquema nuevo. Las migraciones no eliminan registros anteriores; el arranque no importa ni migra automáticamente.

## Prueba local

1. Iniciar `npm run dev` dentro de `backend` y dentro de `frontend`, en terminales separadas.
2. Abrir `http://localhost:5173`. No hace falta subir cambios a GitHub.
3. Jefe: analizar el Excel, revisar advertencias, vincular cuentas en **Gestionar padrón** y generar cuotas del periodo correcto.
4. Usuario: **Mis cuotas**, enviar comprobante. Jefe/administrador: revisar en **Pagos**. El saldo cambia al aprobar.

Verificación: `npm test`, `npm run check:db` y `npm run smoke` en backend; `npm run lint` y `npm run build` en frontend. `npm run migrate` prepara las estructuras aditivas en instalaciones nuevas.

## Pendientes

1. Configurar `MAIL_USER`, `MAIL_PASS` y SMTP para el acceso del jefe. Completar `CLUB_TELEFONO`, `CLUB_CORREO` y `CLUB_DIRECCION`; el formulario guarda mensajes en la bandeja, sin enviarlos por correo.
2. Conciliar las 41 advertencias del Excel, saldo inicial y datos antiguos antes de cerrar el histórico. Verificar o crear la cuenta contador si se utilizará ese rol.
3. Confirmar reglas de reservas y la referencia de la otra página. No se ha verificado equivalencia visual con el video.
4. Antes de producción: renovar la credencial Neon compartida, actualizar `.env`, HTTPS, respaldo de comprobantes y almacenamiento compartido de códigos/límites si existen varios procesos.

Los cambios se mantienen locales, con respaldo de archivos reemplazados, sin commit ni push. Las X de los commits en GitHub corresponden a sus comprobaciones remotas y requieren consultar sus detalles; esta entrega local no cambia esos resultados.
