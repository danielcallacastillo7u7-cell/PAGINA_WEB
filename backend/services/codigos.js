import { randomInt, randomUUID, createHmac, timingSafeEqual } from 'node:crypto';
import { pool } from '../db.js';
import { config } from '../config.js';
import { transaccion } from './contabilidad.js';

function hash(id, nonce, codigo) {
  return createHmac('sha256', config.jwtSecret).update(`${id}:${nonce}:${codigo}`).digest('hex');
}
export async function emitirCodigo(id, enviar) {
  const codigo = String(randomInt(100000,1000000));
  const nonce = randomUUID();
  await pool.query(`INSERT INTO codigos_acceso(usuario_id,nonce,codigo_hash,intentos,vence,usado)
    VALUES($1,$2,$3,0,now()+interval '10 minutes',false)
    ON CONFLICT(usuario_id) DO UPDATE SET nonce=EXCLUDED.nonce,codigo_hash=EXCLUDED.codigo_hash,intentos=0,vence=EXCLUDED.vence,usado=false`, [id,nonce,hash(id,nonce,codigo)]);
  try { await enviar(codigo); }
  catch (error) {
    await pool.query('UPDATE codigos_acceso SET usado=true WHERE usuario_id=$1 AND nonce=$2', [id,nonce]);
    throw error;
  }
}
export async function verificarCodigo(id, codigo) {
  return transaccion(async db => {
    const r = (await db.query(`SELECT c.*,c.vence>now() AS vigente,u.nombre,u.correo,u.rol,u.estado,u.auth_version
      FROM codigos_acceso c JOIN usuarios u ON u.id=c.usuario_id WHERE c.usuario_id=$1 FOR UPDATE OF c`, [id])).rows[0];
    if (!r || r.usado || !r.vigente || r.intentos >= 5 || !r.estado || r.rol !== 'jefe') return {error:'Solicita un nuevo código de acceso.'};
    const valido = timingSafeEqual(Buffer.from(r.codigo_hash,'hex'),Buffer.from(hash(id,r.nonce,codigo),'hex'));
    await db.query('UPDATE codigos_acceso SET intentos=intentos+1,usado=$2 WHERE usuario_id=$1', [id,valido || r.intentos+1 >= 5]);
    if (!valido) return {error:'Código incorrecto.'};
    return {usuario:{id,nombre:r.nombre,correo:r.correo,rol:r.rol,auth_version:r.auth_version}};
  });
}
