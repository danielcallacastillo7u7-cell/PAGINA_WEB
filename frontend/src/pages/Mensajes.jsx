import { useState } from 'react';
import { useRemote,jsonRequest } from '../hooks/useRemote.js';
export default function Mensajes(){const r=useRemote('/api/comunidad/mensajes');const [error,setError]=useState('');
 async function marcar(m){try{await jsonRequest(`/api/comunidad/mensajes/${m.id}`,'PATCH',{atendido:!m.atendido});r.refresh();}catch(e){setError(e.message);}}
 return <section className="panel-box club-panel"><h1>Mensajes de contacto</h1>{(error||r.error)&&<p role="alert">{error||r.error}</p>}{r.loading?<p>Cargando…</p>:!r.data?.length?<p>No hay mensajes.</p>:r.data.map(m=><article className="club-item" key={m.id}><h2>{m.asunto}</h2><p>{m.nombre} — <a href={`mailto:${m.correo}`}>{m.correo}</a></p><p style={{whiteSpace:'pre-wrap'}}>{m.mensaje}</p><button onClick={()=>marcar(m)}>{m.atendido?'Reabrir':'Marcar atendido'}</button></article>)}</section>;
}
