import { Router } from 'express';
import multer from 'multer';
import { mkdir, writeFile, unlink } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { pool } from '../db.js';
import { registrarPago, transaccion, fallo } from '../services/contabilidad.js';
const router = Router();
const uploads=fileURLToPath(new URL('../uploads/',import.meta.url));
const upload=multer({storage:multer.memoryStorage(),limits:{fileSize:5*1024*1024,files:1}});
router.get('/cuotas',async(req,res)=>{
 const socios=(await pool.query('SELECT id,nombre,zona,lote FROM socios_club WHERE usuario_id=$1 AND estado=true',[req.usuario.id])).rows;
 const cuotas=(await pool.query(`SELECT c.*,s.nombre,s.zona,s.lote FROM saldos_cuotas_club c JOIN socios_club s ON s.id=c.socio_id WHERE s.usuario_id=$1 AND s.estado=true ORDER BY c.anio DESC,c.mes DESC`,[req.usuario.id])).rows;
 res.json({socios,cuotas});
});
router.get('/pagos',async(req,res)=>res.json((await pool.query(`SELECT p.*,c.anio,c.mes FROM pagos_cuotas p JOIN socios_club s ON s.id=p.socio_id JOIN cuotas_club c ON c.id=p.cuota_id WHERE s.usuario_id=$1 ORDER BY p.fecha_creacion DESC`,[req.usuario.id])).rows));
router.post('/pagos',upload.single('comprobante'),async(req,res)=>{
 if(!req.file)throw fallo(400,'Adjunta tu comprobante (PNG, JPEG o WebP; máximo 5 MB).');
 const b=req.file.buffer;
 const ext=b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))?'png':b[0]===255&&b[1]===216&&b[2]===255?'jpg':b.toString('ascii',0,4)==='RIFF'&&b.toString('ascii',8,12)==='WEBP'?'webp':null;
 if(!ext)throw fallo(400,'El archivo no es una imagen admitida.');
 const file=`${randomUUID()}.${ext}`;await mkdir(uploads,{recursive:true});
 const target=path.join(uploads,file);await writeFile(target,b,{flag:'wx'});
 try {const pago=await transaccion(db=>registrarPago(db,req.usuario.id,{...req.body,comprobanteUrl:file},true));res.status(201).json({mensaje:'Comprobante enviado para revisión.',pago});}
 catch(error){await unlink(target).catch(()=>{});throw error;}
});
router.get('/pagos/:id/comprobante',async(req,res)=>{
 const r=(await pool.query('SELECT p.comprobante_url,s.usuario_id FROM pagos_cuotas p JOIN socios_club s ON s.id=p.socio_id WHERE p.id=$1',[req.params.id])).rows[0];
 if(!r)throw fallo(404,'Pago no encontrado.');if(r.usuario_id!==req.usuario.id)throw fallo(403,'No tienes acceso.');
 const file=path.basename(r.comprobante_url||'');if(!/\.(png|jpe?g|webp)$/i.test(file))throw fallo(404,'Comprobante no disponible.');
 res.setHeader('X-Content-Type-Options','nosniff');res.sendFile(file,{root:uploads});
});
export default router;
