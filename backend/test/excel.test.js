import test from 'node:test';
import assert from 'node:assert/strict';
import XLSX from 'xlsx';
import {analizarWorkbook,fechaExcel} from '../services/excel.js';
function book(){const b=XLSX.utils.book_new();XLSX.utils.book_append_sheet(b,XLSX.utils.aoa_to_sheet([
 ['SEPTIEMBRE 2026'],['FECHA','DIRECCION','CONCEPTO','N RECIBO','MONTO'],
 ['01-SEP','A-1','Cuota','01',100],['01-SEP','','SALDO ANTERIOR','',900],
 ['','','TOTAL INGRESOS','',1000],
 ['FECHA','N DOC','CONCEPTO','N RECIBO','IMPORTE'],['02-SEP','','Luz','02',20],
 ['','','TOTAL EGRESOS','',20],['','','SALDO FINAL','',980]
 ]),'SEPTIEMBRE');return b;}
test('importación distingue movimientos de saldos y lee IMPORTE',()=>{
 const r=analizarWorkbook(book());assert.equal(r.movimientos.length,2);
 assert.deepEqual(r.movimientos.map(m=>[m.tipo,m.monto,m.fecha]),[['ingreso',100,'2026-09-01'],['egreso',20,'2026-09-02']]);
 assert.ok(r.advertencias.some(m=>m.includes('1000.00')));
});
test('formatos con un millón de filas vacías no generan un millón de registros',()=>{
 const b=book();b.Sheets.SEPTIEMBRE['!ref']='A1:XFD1048576';assert.equal(analizarWorkbook(b).movimientos.length,2);
});
test('fechas cortas requieren año conocido y se validan',()=>{
 assert.equal(fechaExcel('01-SEP',2025),'2025-09-01');assert.equal(fechaExcel('01-SEP'),null);assert.equal(fechaExcel('31/02/2026'),null);
});
test('huella de contenido ignora nombre de archivo y no colapsa filas idénticas válidas',()=>{
 const b=book(),r=analizarWorkbook(b);assert.equal(r.huella,analizarWorkbook(b).huella);
 const sheet=b.Sheets.SEPTIEMBRE;sheet.A10={t:'s',v:'02-SEP'};sheet.C10={t:'s',v:'Luz'};sheet.D10={t:'s',v:'02'};sheet.E10={t:'n',v:20};
 const dup=analizarWorkbook(b);assert.equal(dup.movimientos.length,3);assert.notEqual(dup.movimientos[1].huella,dup.movimientos[2].huella);assert.ok(dup.advertencias.some(m=>m.includes('idéntico')));
});
