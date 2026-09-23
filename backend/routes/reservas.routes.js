import { Router } from 'express';
import { pool } from '../db.js';
import { roles } from '../middleware/auth.js';
import { fallo,fechaValida,transaccion,auditar } from '../services/contabilidad.js';
const router=Router();
export const espacios=['Salón de eventos','Cancha deportiva'];
router.get('/',async(req,res)=>res.json((await pool.query(`SELECT r.*,u.nombre FROM reservas_club r JOIN usuarios u ON u.id=r.usuario_id ${req.usuario.rol==='usuario'?'WHERE r.usuario_id=$1':''} ORDER BY r.fecha DESC,r.hora_inicio`,req.usuario.rol==='usuario'?[req.usuario.id]:[])).rows));
router.post('/',roles('usuario'),async(req,res)=>{
 const {espacio,fecha,hora_inicio,hora_fin,motivo}=req.body||{};
 if(!espacios.includes(espacio)||!fechaValida(fecha)||fecha<new Date().toLocaleDateString('en-CA',{timeZone:'America/Lima'})||!/^([01]\d|2[0-3]):[0-5]\d$/.test(hora_inicio)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(hora_fin)||hora_fin<=hora_inicio||typeof motivo!=='string'||!motivo.trim()||motivo.length>1000)throw fallo(400,'Revisa espacio, fecha, horario y motivo.');
 const r=await pool.query("INSERT INTO reservas_club(usuario_id,espacio,fecha,hora_inicio,hora_fin,motivo) VALUES($1,$2,$3,$4,$5,$6) RETURNING id",[req.usuario.id,espacio,fecha,hora_inicio,hora_fin,motivo]);res.status(201).json({mensaje:'Solicitud enviada. Espera la confirmación de administración.',id:r.rows[0].id});
});
router.patch('/:id',async(req,res)=>{
 const {estado,observacion=''}=req.body||{};
 if(!['aprobada','rechazada','cancelada'].includes(estado)||typeof observacion!=='string'||observacion.length>1000)throw fallo(400,'Estado u observación inválidos.');
 await transaccion(async db=>{
  const r=(await db.query('SELECT * FROM reservas_club WHERE id=$1 FOR UPDATE',[req.params.id])).rows[0];if(!r)throw fallo(404,'Reserva no encontrada.');
  if(req.usuario.rol==='usuario'&&(r.usuario_id!==req.usuario.id||estado!=='cancelada'))throw fallo(403,'No tienes permiso.');
  if(!['pendiente','aprobada'].includes(r.estado)||estado!=='cancelada'&&r.estado!=='pendiente')throw fallo(409,'La solicitud ya fue revisada.');
  if(estado==='aprobada'){
   await db.query('SELECT pg_advisory_xact_lock(hashtext($1))',[r.espacio]);
   const choque=await db.query("SELECT id FROM reservas_club WHERE espacio=$1 AND fecha=$2 AND estado='aprobada' AND hora_inicio<$4 AND hora_fin>$3",[r.espacio,r.fecha,r.hora_inicio,r.hora_fin]);
   if(choque.rowCount)throw fallo(409,'Ya hay una reserva aprobada en ese horario.');
  }
  await db.query('UPDATE reservas_club SET estado=$1,observacion=$2 WHERE id=$3',[estado,observacion,r.id]);await auditar(db,req.usuario.id,estado,'reserva',r.id,{observacion});
 });res.json({mensaje:'Reserva actualizada.'});
});
export default router;
