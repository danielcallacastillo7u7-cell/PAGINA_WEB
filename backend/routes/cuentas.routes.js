import { Router } from 'express';
import { pool } from '../db.js';
import { editarCuenta } from '../services/cuentas.js';
const router = Router();
router.get('/', async (_req,res) => res.json((await pool.query('SELECT id,nombre,correo,rol,estado FROM usuarios ORDER BY nombre,id')).rows));
router.put('/:id', async (req,res) => res.json({usuario:await editarCuenta(req.usuario,Number(req.params.id),req.body),mensaje:'Cuenta actualizada. Sus sesiones anteriores quedaron cerradas.'}));
export default router;
