import XLSX from 'xlsx';
import { analizarWorkbook } from '../services/excel.js';
const r=analizarWorkbook(XLSX.readFile(process.argv[2],{cellDates:true}));
console.log(JSON.stringify({socios:r.socios.length,movimientos:r.movimientos.length,advertencias:r.advertencias,conciliacion:r.conciliacion},null,2));
