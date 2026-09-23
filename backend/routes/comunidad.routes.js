import { Router } from 'express';
import { pool } from '../db.js';
import { roles } from '../middleware/auth.js';
import { fallo } from '../services/contabilidad.js';
export const publico=Router();
export const comunidad=Router();
const intentos=new Map();
const limpieza=setInterval(()=>{for(const[k,v]of intentos)if(v.vence<Date.now())intentos.delete(k);},60000);limpieza.unref();
publico.get('/contacto',(_req,res)=>res.json({telefono:process.env.CLUB_TELEFONO||'',correo:process.env.CLUB_CORREO||'',direccion:process.env.CLUB_DIRECCION||''}));
publico.post('/contacto',async(req,res)=>{
 const {nombre,correo,asunto,mensaje}=req.body||{};
 if(![nombre,correo,asunto,mensaje].every(v=>typeof v==='string'&&v.trim())||nombre.length>120||correo.length>200||asunto.length>160||mensaje.length>3000||!/^\S+@\S+\.\S+$/.test(correo))throw fallo(400,'Completa los campos con un correo válido (mensaje máximo 3000 caracteres).');
 let r=intentos.get(req.ip);if(!r||r.vence<Date.now())r={cuenta:0,vence:Date.now()+600000};
 if(r.cuenta>=5)throw fallo(429,'Espera unos minutos antes de enviar otro mensaje.');r.cuenta++;intentos.set(req.ip,r);
 await pool.query('INSERT INTO mensajes_contacto(nombre,correo,asunto,mensaje) VALUES($1,$2,$3,$4)',[nombre.trim(),correo.trim(),asunto.trim(),mensaje.trim()]);
 res.status(201).json({mensaje:'Mensaje registrado. La administración lo verá en su bandeja.'});
});
comunidad.get('/avisos',async(_req,res)=>res.json((await pool.query('SELECT id,titulo,contenido,fecha FROM avisos_club WHERE activo=true ORDER BY fecha DESC')).rows));
comunidad.post('/avisos',roles('jefe','admin'),async(req,res)=>{
 const {titulo,contenido}=req.body||{};
 if(typeof titulo!=='string'||!titulo.trim()||titulo.length>160||typeof contenido!=='string'||!contenido.trim()||contenido.length>5000)throw fallo(400,'Completa título y contenido (máximo 5000 caracteres).');
 const r=await pool.query('INSERT INTO avisos_club(titulo,contenido,autor_id) VALUES($1,$2,$3) RETURNING id',[titulo.trim(),contenido.trim(),req.usuario.id]);res.status(201).json(r.rows[0]);
});
comunidad.patch('/avisos/:id/archivar',roles('jefe','admin'),async(req,res)=>{await pool.query('UPDATE avisos_club SET activo=false WHERE id=$1',[req.params.id]);res.json({mensaje:'Aviso archivado.'});});
comunidad.get('/mensajes',roles('jefe','admin'),async(_req,res)=>res.json((await pool.query('SELECT * FROM mensajes_contacto ORDER BY fecha DESC')).rows));
comunidad.patch('/mensajes/:id',roles('jefe','admin'),async(req,res)=>{if(typeof req.body.atendido!=='boolean')throw fallo(400,'Estado inválido.');await pool.query('UPDATE mensajes_contacto SET atendido=$1 WHERE id=$2',[req.body.atendido,req.params.id]);res.json({mensaje:'Estado actualizado.'});});
