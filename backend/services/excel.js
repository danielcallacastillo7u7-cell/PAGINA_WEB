import XLSX from 'xlsx';
import { createHash } from 'node:crypto';
export const normalizar=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toUpperCase().replace(/\s+/g,' ');
const texto=v=>String(v??'').trim();
export function numero(v){
 if(v===null||v===undefined||String(v).trim()==='')return null;
 const n=Number(String(v).replace(/S\/\.?/gi,'').replace(/,/g,'').trim());return Number.isFinite(n)?Math.round(n*100)/100:null;
}
const meses=['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];
export function fechaExcel(v,anio){
 let y,m,d;
 if(v instanceof Date){if(Number.isNaN(v.getTime()))return null;return v.toISOString().slice(0,10);}
 if(typeof v==='number'){const f=XLSX.SSF.parse_date_code(v);if(!f)return null;({y,m,d}=f);}
 else {
  const s=normalizar(v);let r;
  if((r=/^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s))){[,y,m,d]=r;}
  else if((r=/^(\d{1,2})[/-](\d{1,2})[/-](\d{2}|\d{4})$/.exec(s))){d=r[1];m=r[2];y=r[3].length===2?2000+Number(r[3]):r[3];}
  else if((r=/^(\d{1,2})[- /]([A-Z]+)(?:[- /](\d{4}))?$/.exec(s))){d=r[1];m=meses.indexOf(r[2].slice(0,3))+1;y=r[3]||anio;}
  else return null;
 }
 if(!y||Number(y)<1900||Number(y)>2200||!m||!d)return null;
 const iso=`${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
 const date=new Date(iso+'T12:00:00Z');return !Number.isNaN(date.getTime())&&date.toISOString().slice(0,10)===iso?iso:null;
}
export function filasHoja(sheet){
 // Some supplied sheets declare a million formatted rows. Read only actual values.
 const entries=Object.keys(sheet).filter(k=>/^[A-Z]+\d+$/.test(k)&&sheet[k].v!==undefined&&sheet[k].v!==null&&sheet[k].v!=='');
 const max=entries.reduce((n,k)=>Math.max(n,XLSX.utils.decode_cell(k).r),0);
 if(max>50000||entries.length>300000)throw new Error('La hoja excede el límite de filas de importación.');
 return XLSX.utils.sheet_to_json(sheet,{header:1,defval:null,raw:true,range:{s:{r:0,c:0},e:{r:max,c:Math.min(100,entries.reduce((n,k)=>Math.max(n,XLSX.utils.decode_cell(k).c),0))}}});
}
export function analizarWorkbook(workbook){
 const socios=[],movimientos=[],advertencias=[],conciliacion=[];
 const sheetName=workbook.SheetNames.find(n=>normalizar(n)==='LISTA SOCIOS');
 if(sheetName){
  const rows=filasHoja(workbook.Sheets[sheetName]);
  const header=rows.findIndex(r=>normalizar(r[5]).includes('SOCIO')&&normalizar(r[6]).includes('CUOTA'));
  if(header<0)advertencias.push('LISTA SOCIOS: no se reconoció el encabezado del padrón.');
  else for(let i=header+1;i<rows.length;i++){
   const r=rows[i];if(!numero(r[0])||!texto(r[5])||(!texto(r[2])&&!texto(r[3])))continue;
   const cuota=numero(r[6]);if(cuota===null||cuota<0){advertencias.push(`LISTA SOCIOS, fila ${i+1}: cuota base inválida.`);continue;}
   socios.push({numeroExcel:numero(r[0]),direccionTipo:texto(r[1]),zona:texto(r[2]),lote:texto(r[3]),tipo:texto(r[4]),nombre:texto(r[5]),cuotaBase:cuota});
  }
 }
 for(const nombreHoja of workbook.SheetNames){
  if(nombreHoja===sheetName)continue;
  const rows=filasHoja(workbook.Sheets[nombreHoja]);
  const counts=new Map();
  for(const r of rows)for(const v of r.slice(0,4))if(v instanceof Date&&!Number.isNaN(v.getTime()))counts.set(v.getUTCFullYear(),(counts.get(v.getUTCFullYear())||0)+1);
  const titleYear=rows.slice(0,10).flat().map(texto).join(' ').match(/20\d{2}/)?.[0];
  const year=[...counts].sort((a,b)=>b[1]-a[1])[0]?.[0]||Number(titleYear)||null;
  let columns=null,tipo=null;const local=[],declarados={};
  for(let i=0;i<rows.length;i++){
   const r=rows[i],norm=r.map(normalizar),joined=norm.join(' ');
   const total=norm.find(v=>/^TOTAL (INGRESOS|EGRESOS)/.test(v));
   if(total){const value=numero(r[columns?.monto??(r.length-1)]);declarados[total.includes('INGRESOS')?'ingreso':'egreso']=value;continue;}
   const concepto=norm.findIndex(v=>v==='CONCEPTO');
   if(concepto>=0){
    const monto=norm.findIndex(v=>v.includes('MONTO')||v.includes('IMPORTE'));
    const fecha=norm.findIndex(v=>v==='FECHA');
    const direccion=norm.findIndex(v=>v==='DIRECCION');
    const recibo=norm.findIndex(v=>v.includes('RECIBO')||v.includes('DOC')||v.includes('COMPROBANTE'));
    columns={concepto,monto:monto>=0?monto:columns?.monto??concepto+2,fecha:fecha>=0?fecha:Math.max(0,concepto-2),direccion,recibo};
    tipo=direccion>=0?'ingreso':'egreso';continue;
   }
   if(!columns){if(/^\s*(INGRESOS|EGRESOS)\b/.test(joined))tipo=joined.trim().startsWith('EGRESOS')?'egreso':'ingreso';continue;}
   const conceptoTexto=texto(r[columns.concepto]);const c=normalizar(conceptoTexto);
   if(!conceptoTexto||/^(SALDO|TOTAL|SUBTOTAL|INGRESOS|EGRESOS)\b/.test(c))continue;
   const rawMonto=r[columns.monto],monto=numero(rawMonto);if(monto===null||monto===0)continue;
   const fecha=fechaExcel(r[columns.fecha],year);
   if(!fecha||monto<0){advertencias.push(`${nombreHoja}, fila ${i+1}: fecha o monto inválido; no se importará.`);continue;}
   const mov={fecha,tipo,direccion:columns.direccion>=0?texto(r[columns.direccion]):'',concepto:conceptoTexto,numeroRecibo:columns.recibo>=0?texto(r[columns.recibo]):'',monto,hojaExcel:nombreHoja,filaExcel:i+1};
   mov.huella=createHash('sha256').update(JSON.stringify([fecha,tipo,normalizar(mov.direccion),normalizar(mov.concepto),normalizar(mov.numeroRecibo),monto])).digest('hex');
   local.push(mov);
  }
  if(!columns)continue;
  for(const tipoMov of ['ingreso','egreso']){
   const calculado=Math.round(local.filter(m=>m.tipo===tipoMov).reduce((sum,m)=>sum+Math.round(m.monto*100),0))/100;
   const declarado=declarados[tipoMov]??null;const diferencia=declarado===null?null:Math.round((calculado-declarado)*100)/100;
   conciliacion.push({hoja:nombreHoja,tipo:tipoMov,calculado,declarado,diferencia});
   if(diferencia!==null&&Math.abs(diferencia)>0.01)advertencias.push(`${nombreHoja}: ${tipoMov}s detectados S/ ${calculado.toFixed(2)}; total del archivo S/ ${declarado.toFixed(2)}.`);
  }
  movimientos.push(...local);
 }
 const repetidos=new Map();
 for(const m of movimientos){const n=(repetidos.get(m.huella)||0)+1;repetidos.set(m.huella,n);if(n>1){advertencias.push(`${m.hojaExcel}, fila ${m.filaExcel}: movimiento idéntico a otra fila; verifica que ambos sean válidos.`);m.huella=createHash('sha256').update(m.huella+':'+n).digest('hex');}}
 const huella=createHash('sha256').update(JSON.stringify({socios,movimientos:movimientos.map(m=>m.huella).sort()})).digest('hex');
 return {socios,movimientos,advertencias,conciliacion,huella};
}
