import { pool } from "../db.js";
const required = {
  usuarios: "id nombre correo password_hash rol estado fecha_creacion",
  socios_club: "id usuario_id numero_excel direccion_tipo zona lote tipo nombre cuota_base estado fecha_creacion importacion_id",
  cuotas_club: "id socio_id anio mes monto estado fecha_vencimiento fecha_creacion",
  pagos_cuotas: "id cuota_id socio_id monto fecha_pago metodo_pago numero_recibo referencia comprobante_url estado observacion fecha_creacion fecha_revision",
  movimientos_financieros: "id fecha tipo direccion categoria concepto monto metodo_pago numero_recibo referencia observacion hoja_excel importacion_id fecha_creacion",
  importaciones_excel: "id nombre_archivo total_socios total_movimientos huella",
  saldos_cuotas_club: "id socio_id monto pagado en_revision saldo disponible estado",
  movimientos_vigentes_club: "id monto anulado huella",
  avisos_club: "id titulo contenido autor_id activo fecha",
  mensajes_contacto: "id nombre correo asunto mensaje atendido fecha",
  reservas_club: "id usuario_id espacio fecha hora_inicio hora_fin estado",
  auditoria_club: "id usuario_id accion entidad entidad_id datos fecha",
};
try {
  const result = await pool.query("SELECT table_name, column_name, data_type, column_default, is_nullable FROM information_schema.columns WHERE table_schema = 'public'");
  let missing = false;
  for (const [table, fields] of Object.entries(required)) {
    const columns = result.rows.filter(r => r.table_name === table);
    const absent = fields.split(" ").filter(c => !columns.some(r => r.column_name === c));
    console.log(table + ": " + (absent.length ? "FALTAN " + absent.join(", ") : "columnas presentes"));
    missing ||= absent.length > 0;
  }
  const constraints = await pool.query(`SELECT conrelid::regclass::text AS tabla, pg_get_constraintdef(oid) AS definicion FROM pg_constraint WHERE connamespace = 'public'::regnamespace AND contype IN ('u', 'f', 'c')`);
  console.log("Restricciones para revisión (sin datos personales):", constraints.rows);
  console.log("Verificar UNIQUE(socio_id, anio, mes), claves foráneas, estados, roles y defaults antes de usar módulos.");
  process.exitCode = missing ? 1 : 0;
} catch (error) {
  console.error("No se pudo verificar PostgreSQL. Código:", error.code || "desconocido");
  process.exitCode = 1;
} finally { await pool.end(); }
