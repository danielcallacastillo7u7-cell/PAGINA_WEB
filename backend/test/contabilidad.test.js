import test from 'node:test';
import assert from 'node:assert/strict';
process.env.DATABASE_URL='postgresql://test:test@localhost/test';
process.env.JWT_SECRET='test-only-secret-not-for-production-123456789';
const {centimos,validarAbono,fechaValida,registrarPago,revisarPago}=await import('../services/contabilidad.js');
test('abonos calculan centavos y rechazan exceso o valores inválidos',()=>{
 assert.equal(validarAbono('0.20','1.00','0.10'),0.70);
 assert.equal(validarAbono('60','160','100'),0);
 for(const v of [-1,'1.001','NaN',Infinity,''])assert.throws(()=>centimos(v));
 assert.throws(()=>validarAbono('61','160','100'),{status:409});
 assert.throws(()=>validarAbono('0','160','0'),{status:400});
});
test('fechas inválidas no se normalizan silenciosamente',()=>{
 assert.equal(fechaValida('2026-02-29'),false);
 assert.equal(fechaValida('2024-02-29'),true);
 assert.equal(fechaValida('2026-13-01'),false);
});
test('un socio no registra pagos de otra cuenta',async()=>{
 const db={query:async()=>({rows:[{id:1,usuario_id:2,socio_activo:true,monto:'160'}]})};
 await assert.rejects(registrarPago(db,3,{monto:'40',fechaPago:'2026-09-21',metodoPago:'transferencia',cuotaId:1},true),{status:403});
});
test('los comprobantes pendientes reservan saldo contra dobles envíos',async()=>{
 const db={query:async sql=>({rows:sql.includes('SELECT c.*')?[{id:1,usuario_id:2,socio_activo:true,monto:'160'}]:[{total:'140'}]})};
 await assert.rejects(registrarPago(db,2,{monto:'40',fechaPago:'2026-09-21',metodoPago:'transferencia',cuotaId:1},true),{status:409});
});
test('no se puede volver a aprobar un pago ya revisado',async()=>{
 const db={query:async()=>({rows:[{id:1,estado:'aprobado'}]})};
 await assert.rejects(revisarPago(db,1,1,'aprobar'),{status:409});
});
