import { Router } from 'express';
import { pool } from '../db.js';
import { actualizarSocioCuenta } from '../services/cuentas.js';
const router=Router();
router.get('/socios',async(_req,res)=>res.json((await pool.query("SELECT id,nombre,correo,rol,estado,fecha_creacion FROM usuarios WHERE rol='usuario' ORDER BY id DESC")).rows));
router.put('/socios/:id',async(req,res)=>res.json({mensaje:'Socio actualizado. Sus sesiones anteriores quedaron cerradas.',socio:await actualizarSocioCuenta(req.usuario,Number(req.params.id),{nombre:req.body?.nombre,correo:req.body?.correo})}));
router.patch('/socios/:id/desactivar',async(req,res)=>res.json({mensaje:'Socio desactivado.',socio:await actualizarSocioCuenta(req.usuario,Number(req.params.id),{estado:false})}));
router.patch('/socios/:id/activar',async(req,res)=>res.json({mensaje:'Socio activado. Debe iniciar sesión nuevamente.',socio:await actualizarSocioCuenta(req.usuario,Number(req.params.id),{estado:true})}));
export default router;
