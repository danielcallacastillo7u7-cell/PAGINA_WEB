import { pool } from '../db.js';
export function fallo(status, mensaje) { return Object.assign(new Error(mensaje), { status }); }
export function centimos(valor) {
  const text = String(valor ?? '').trim();
  if (!/^\d+(\.\d{1,2})?$/.test(text)) throw fallo(400, 'El monto debe tener como máximo dos decimales.');
  const n = Math.round(Number(text) * 100);
  if (!Number.isSafeInteger(n) || n > 999999999999) throw fallo(400, 'Monto fuera de rango.');
  return n;
}
export function validarAbono(monto, cuota, cobrado) {
  const abono = centimos(monto), saldo = centimos(cuota) - centimos(cobrado);
  if (abono <= 0) throw fallo(400, 'El monto debe ser mayor que cero.');
  if (abono > saldo) throw fallo(409, 'El pago supera el saldo pendiente de la cuota.');
  return (saldo - abono) / 100;
}
export function fechaValida(valor) {
  if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
  const d = new Date(valor + 'T12:00:00Z');
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0,10) === valor;
}
export async function transaccion(fn) {
  const db = await pool.connect();
  try { await db.query('BEGIN'); const result = await fn(db); await db.query('COMMIT'); return result; }
  catch (error) { await db.query('ROLLBACK'); throw error; }
  finally { db.release(); }
}
export async function auditar(db, usuario, accion, entidad, id, datos = {}) {
  await db.query('INSERT INTO auditoria_club (usuario_id,accion,entidad,entidad_id,datos) VALUES ($1,$2,$3,$4,$5)', [usuario,accion,entidad,id,JSON.stringify(datos)]);
}
export async function registrarPago(db, usuario, datos, soloPropio = false) {
  const monto = centimos(datos.monto);
  if (monto <= 0 || !fechaValida(datos.fechaPago) || !String(datos.metodoPago || '').trim()) throw fallo(400, 'Revisa monto, fecha y método de pago.');
  const { rows } = await db.query('SELECT c.*, s.usuario_id, s.estado AS socio_activo FROM cuotas_club c JOIN socios_club s ON s.id=c.socio_id WHERE c.id=$1 FOR UPDATE OF c', [datos.cuotaId]);
  const cuota = rows[0];
  if (!cuota) throw fallo(404, 'Cuota no encontrada.');
  if (soloPropio && cuota.usuario_id !== usuario) throw fallo(403, 'Esta cuota no pertenece a tu cuenta.');
  if (!cuota.socio_activo) throw fallo(409, 'El socio está inactivo.');
  const total = await db.query("SELECT COALESCE(SUM(monto),0) AS total FROM pagos_cuotas WHERE cuota_id=$1 AND estado IN ('pendiente','aprobado')", [cuota.id]);
  validarAbono(datos.monto, cuota.monto, total.rows[0].total);
  const pago = await db.query(`INSERT INTO pagos_cuotas (cuota_id,socio_id,monto,fecha_pago,metodo_pago,numero_recibo,referencia,observacion,comprobante_url,estado)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'pendiente') RETURNING *`,
    [cuota.id,cuota.socio_id,monto/100,datos.fechaPago,String(datos.metodoPago).trim(),datos.numeroRecibo||null,datos.referencia||null,datos.observacion||null,datos.comprobanteUrl||null]);
  await auditar(db,usuario,'registrar','pago',pago.rows[0].id,{cuotaId:cuota.id,monto:monto/100});
  return pago.rows[0];
}
export async function revisarPago(db, usuario, id, accion, motivo) {
  if (!['aprobar','rechazar','anular'].includes(accion)) throw fallo(404,'Acción no encontrada.');
  if (accion === 'anular' && !String(motivo || '').trim()) throw fallo(400,'Indica el motivo de anulación.');
  const { rows } = await db.query('SELECT * FROM pagos_cuotas WHERE id=$1 FOR UPDATE',[id]);
  const pago=rows[0];
  if (!pago) throw fallo(404,'Pago no encontrado.');
  if (pago.estado !== (accion === 'anular' ? 'aprobado' : 'pendiente')) throw fallo(409,'El pago ya cambió de estado. Actualiza la lista.');
  const cuota = (await db.query('SELECT * FROM cuotas_club WHERE id=$1 FOR UPDATE',[pago.cuota_id])).rows[0];
  const total = (await db.query("SELECT COALESCE(SUM(monto),0) AS total FROM pagos_cuotas WHERE cuota_id=$1 AND estado='aprobado'",[pago.cuota_id])).rows[0].total;
  if (accion === 'aprobar') validarAbono(pago.monto,cuota.monto,total);
  await db.query('UPDATE pagos_cuotas SET estado=$1, observacion=COALESCE($2,observacion),fecha_revision=now() WHERE id=$3',[accion==='aprobar'?'aprobado':'rechazado',motivo||null,id]);
  await db.query(`UPDATE cuotas_club c SET estado=CASE
    WHEN c.monto <= (SELECT COALESCE(SUM(monto),0) FROM pagos_cuotas WHERE cuota_id=c.id AND estado='aprobado') THEN 'pagado'
    WHEN c.fecha_vencimiento < CURRENT_DATE THEN 'vencido' ELSE 'pendiente' END WHERE c.id=$1`,[pago.cuota_id]);
  await auditar(db,usuario,accion,'pago',pago.id,{monto:pago.monto,motivo:motivo||null});
  return { mensaje: accion === 'anular' ? 'Pago anulado; saldo de la cuota recalculado.' : 'Pago revisado y saldo actualizado.' };
}
