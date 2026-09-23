import bcrypt from 'bcryptjs';
import { fallo, transaccion, auditar } from './contabilidad.js';

export function validarIdentidad(nombre, correo) {
  if (typeof nombre !== 'string' || !nombre.trim() || nombre.trim().length > 100 ||
      typeof correo !== 'string' || correo.trim().length > 150 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim())) {
    throw fallo(400, 'Indica un nombre y un correo válidos.');
  }
  return { nombre: nombre.trim(), correo: correo.trim().toLowerCase() };
}

export function validarPassword(password) {
  if (typeof password !== 'string' || password.length < 8 || Buffer.byteLength(password, 'utf8') > 72 ||
      !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
    throw fallo(400, 'La contraseña debe tener al menos 8 caracteres, mayúscula, minúscula, número y símbolo (máximo 72 bytes).');
  }
}

export async function crearCuenta(actor, datos) {
  const identidad = validarIdentidad(datos.nombre, datos.correo);
  const permitidos = actor.rol === 'jefe' ? ['jefe','admin','contador','usuario'] : ['usuario'];
  if (!permitidos.includes(datos.rol)) throw fallo(400, 'Rol no permitido.');
  validarPassword(datos.password);
  const hash = await bcrypt.hash(datos.password, 10);
  return transaccion(async db => {
    await db.query("SELECT pg_advisory_xact_lock(hashtext('cuentas-club'))");
    await verificarActor(db, actor);
    if ((await db.query('SELECT id FROM usuarios WHERE LOWER(correo)=$1', [identidad.correo])).rowCount) throw fallo(409, 'Ese correo ya está registrado.');
    const r = await db.query(`INSERT INTO usuarios(nombre,correo,password_hash,rol) VALUES($1,$2,$3,$4)
      RETURNING id,nombre,correo,rol,estado`, [identidad.nombre,identidad.correo,hash,datos.rol]);
    await auditar(db, actor.id, 'crear', 'cuenta', r.rows[0].id, {rol:datos.rol});
    return r.rows[0];
  });
}

export async function editarCuenta(actor, id, datos) {
  const identidad = validarIdentidad(datos.nombre, datos.correo);
  if (!Number.isSafeInteger(id) || !['jefe','admin','contador','usuario'].includes(datos.rol) || typeof datos.estado !== 'boolean') throw fallo(400, 'Cuenta, rol o estado inválidos.');
  return transaccion(async db => {
    await db.query("SELECT pg_advisory_xact_lock(hashtext('cuentas-club'))");
    await verificarActor(db, actor, true);
    const actual = (await db.query('SELECT id,rol,estado FROM usuarios WHERE id=$1 FOR UPDATE', [id])).rows[0];
    if (!actual) throw fallo(404, 'Cuenta no encontrada.');
    if (id === actor.id && (datos.rol !== 'jefe' || !datos.estado)) throw fallo(409, 'No puedes quitarte el acceso de jefe ni desactivar tu propia cuenta.');
    if ((await db.query('SELECT id FROM usuarios WHERE LOWER(correo)=$1 AND id<>$2', [identidad.correo,id])).rowCount) throw fallo(409, 'Ese correo ya está registrado.');
    const r = await db.query(`UPDATE usuarios SET nombre=$1,correo=$2,rol=$3,estado=$4,auth_version=auth_version+1
      WHERE id=$5 RETURNING id,nombre,correo,rol,estado`, [identidad.nombre,identidad.correo,datos.rol,datos.estado,id]);
    await db.query('UPDATE codigos_acceso SET usado=true WHERE usuario_id=$1', [id]);
    await auditar(db, actor.id, 'editar', 'cuenta', id, {anterior:{rol:actual.rol,estado:actual.estado},nuevo:{rol:datos.rol,estado:datos.estado}});
    return r.rows[0];
  });
}

async function verificarActor(db, actor, soloJefe = false) {
  const actual = (await db.query('SELECT rol,estado,auth_version FROM usuarios WHERE id=$1', [actor.id])).rows[0];
  if (!actual?.estado || !(soloJefe?['jefe']:['jefe','admin']).includes(actual.rol) || actual.rol !== actor.rol || actual.auth_version !== (actor.auth_version || 0)) {
    throw fallo(403, 'Tu acceso cambió. Inicia sesión nuevamente.');
  }
}

export async function actualizarSocioCuenta(actor, id, datos) {
  if (!Number.isSafeInteger(id)) throw fallo(400,'Cuenta inválida.');
  const soloEstado = Object.hasOwn(datos,'estado');
  if (soloEstado && typeof datos.estado !== 'boolean') throw fallo(400,'Estado inválido.');
  const identidad = soloEstado ? null : validarIdentidad(datos.nombre,datos.correo);
  return transaccion(async db => {
    await db.query("SELECT pg_advisory_xact_lock(hashtext('cuentas-club'))");
    await verificarActor(db,actor);
    const actual=(await db.query("SELECT id FROM usuarios WHERE id=$1 AND rol='usuario' FOR UPDATE",[id])).rows[0];
    if (!actual) throw fallo(404,'Socio no encontrado.');
    if (identidad && (await db.query('SELECT id FROM usuarios WHERE LOWER(correo)=$1 AND id<>$2',[identidad.correo,id])).rowCount) throw fallo(409,'Ese correo ya está registrado.');
    const r = soloEstado
      ? await db.query("UPDATE usuarios SET estado=$1,auth_version=auth_version+1 WHERE id=$2 RETURNING id,nombre,correo,rol,estado",[datos.estado,id])
      : await db.query("UPDATE usuarios SET nombre=$1,correo=$2,auth_version=auth_version+1 WHERE id=$3 RETURNING id,nombre,correo,rol,estado",[identidad.nombre,identidad.correo,id]);
    await db.query('UPDATE codigos_acceso SET usado=true WHERE usuario_id=$1',[id]);
    await auditar(db,actor.id,soloEstado?(datos.estado?'activar':'desactivar'):'editar','cuenta',id);
    return r.rows[0];
  });
}
