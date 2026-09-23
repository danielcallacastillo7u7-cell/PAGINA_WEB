import { Router } from 'express';
import multer from 'multer';
import XLSX from 'xlsx';
import { pool } from '../db.js';
import { analizarWorkbook } from './excel.js';
import { transaccion, auditar, fallo } from './contabilidad.js';
const router=Router();
const upload=multer({storage:multer.memoryStorage(),limits:{fileSize:10*1024*1024,files:1}});
function analizar(req){
 if(!req.file)throw fallo(400,'Selecciona un archivo Excel.');
 let result;try {result=analizarWorkbook(XLSX.read(req.file.buffer,{type:'buffer',cellDates:true}));}catch{throw fallo(400,'No se pudo leer el Excel o supera el límite de filas.');}
 if(!result.socios.length&&!result.movimientos.length)throw fallo(400,'No se reconocieron socios ni movimientos. Revisa los encabezados del archivo.');
 return result;
}
router.get('/historial',async(_req,res)=>res.json((await pool.query('SELECT id,nombre_archivo,total_socios,total_movimientos,fecha_creacion FROM importaciones_excel ORDER BY id DESC')).rows));
router.post('/analizar',upload.single('archivo'),async(req,res)=>{
 const r=analizar(req);const ingresos=r.movimientos.filter(m=>m.tipo==='ingreso'),egresos=r.movimientos.filter(m=>m.tipo==='egreso');
 res.json({archivo:req.file.originalname,resumen:{socios:r.socios.length,movimientos:r.movimientos.length,ingresos:ingresos.length,egresos:egresos.length,montoIngresos:ingresos.reduce((s,m)=>s+Math.round(m.monto*100),0)/100,montoEgresos:egresos.reduce((s,m)=>s+Math.round(m.monto*100),0)/100},socios:r.socios.slice(0,20),movimientos:r.movimientos.slice(0,50),advertencias:r.advertencias,conciliacion:r.conciliacion});
});
router.post('/confirmar',upload.single('archivo'),async(req,res)=>{
 const r=analizar(req);
 if(r.advertencias.length&&req.body.aceptarAdvertencias!=='true')throw fallo(409,'Revisa las advertencias y confirma su aceptación antes de importar.');
 const resultado=await transaccion(async db=>{
  await db.query("SELECT pg_advisory_xact_lock(hashtext('importacion-club'))");
  if((await db.query('SELECT id FROM importaciones_excel WHERE huella=$1',[r.huella])).rowCount)throw fallo(409,'Este contenido ya fue importado, aunque cambies el nombre del archivo.');
  const {id}= (await db.query('INSERT INTO importaciones_excel(nombre_archivo,total_socios,total_movimientos,huella) VALUES($1,0,0,$2) RETURNING id',[req.file.originalname,r.huella])).rows[0];
  let socios=0,movimientos=0;
  for(const s of r.socios){
   const existe=await db.query('SELECT id FROM socios_club WHERE LOWER(TRIM(nombre))=LOWER(TRIM($1)) AND UPPER(TRIM(zona))=UPPER(TRIM($2)) AND UPPER(TRIM(lote))=UPPER(TRIM($3))',[s.nombre,s.zona,s.lote]);
   if(existe.rowCount)continue;
   await db.query('INSERT INTO socios_club(numero_excel,direccion_tipo,zona,lote,tipo,nombre,cuota_base,importacion_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8)',[s.numeroExcel,s.direccionTipo,s.zona,s.lote,s.tipo,s.nombre,s.cuotaBase,id]);socios++;
  }
  for(const m of r.movimientos){
   const result=await db.query(`INSERT INTO movimientos_financieros(fecha,tipo,direccion,concepto,numero_recibo,monto,hoja_excel,importacion_id,huella)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT(huella) WHERE huella IS NOT NULL DO NOTHING RETURNING id`,[m.fecha,m.tipo,m.direccion,m.concepto,m.numeroRecibo,m.monto,m.hojaExcel,id,m.huella]);movimientos+=result.rowCount;
  }
  await db.query('UPDATE importaciones_excel SET total_socios=$1,total_movimientos=$2 WHERE id=$3',[socios,movimientos,id]);
  await auditar(db,req.usuario.id,'importar','excel',id,{socios,movimientos,advertencias:r.advertencias});
  return {importacionId:id,socios,movimientos,sociosExistentes:r.socios.length-socios,movimientosExistentes:r.movimientos.length-movimientos};
 });res.status(201).json({mensaje:'Importación completada.',...resultado});
});
export default router;
