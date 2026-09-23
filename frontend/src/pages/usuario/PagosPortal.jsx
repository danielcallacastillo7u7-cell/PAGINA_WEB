import { useRemote } from '../../hooks/useRemote.js';
import { descargarComprobante } from '../../api.js';
export default function PagosPortal(){
 const actual=useRemote('/api/portal/pagos');const usuario=JSON.parse(localStorage.getItem('usuario')||'{}');const previo=useRemote(`/api/solicitudes/usuario/${usuario.id}`);
 return <section className="panel-box club-panel"><h1>Mis pagos</h1>{[actual,previo].map((r,i)=><section key={i}><h2>{i?'Solicitudes anteriores':'Pagos de cuotas'}</h2>{r.error&&<p role="alert">{r.error}</p>}{r.loading?<p>Cargando…</p>:!r.data?.length?<p>Sin pagos registrados.</p>:r.data.map(p=><article className="club-item" key={p.id}><strong>S/ {Number(p.monto).toFixed(2)} — {p.estado}</strong><p>{i?p.descripcion:`Cuota ${p.mes}/${p.anio}`}</p><p>{String(p.fecha_pago).slice(0,10)}</p>{p.observacion&&<p>{p.observacion}</p>}{p.comprobante_url&&<button onClick={()=>descargarComprobante(i?`/api/solicitudes/${p.id}/comprobante`:`/api/portal/pagos/${p.id}/comprobante`)}>Descargar comprobante</button>}</article>)}</section>)}</section>;
}
