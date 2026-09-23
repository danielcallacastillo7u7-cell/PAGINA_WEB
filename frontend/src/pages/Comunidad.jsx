import { useState } from 'react';
import { useRemote,jsonRequest } from '../hooks/useRemote.js';
export default function Comunidad({gestion=false}){
 const r=useRemote('/api/comunidad/avisos');const [mensaje,setMensaje]=useState(''),[busy,setBusy]=useState(false);
 async function publicar(e){e.preventDefault();const form=e.currentTarget;setBusy(true);try{await jsonRequest('/api/comunidad/avisos','POST',Object.fromEntries(new FormData(form)));form.reset();r.refresh();setMensaje('Aviso publicado.');}catch(e){setMensaje(e.message);}finally{setBusy(false);}}
 async function archivar(id){if(!window.confirm('¿Archivar este aviso?'))return;try{await jsonRequest(`/api/comunidad/avisos/${id}/archivar`,'PATCH',{});r.refresh();}catch(e){setMensaje(e.message);}}
 return <section className="panel-box club-panel"><h1>Avisos del club</h1>{gestion&&<form className="club-form" onSubmit={publicar}><label>Título<input name="titulo" maxLength={160} required/></label><label>Contenido<textarea name="contenido" rows={4} maxLength={5000} required/></label><button disabled={busy}>Publicar aviso</button></form>}{mensaje&&<p role="status">{mensaje}</p>}{r.error&&<p role="alert">{r.error}</p>}{r.loading?<p>Cargando…</p>:!r.data?.length?<p>No hay avisos publicados.</p>:r.data.map(a=><article className="club-item" key={a.id}><h2>{a.titulo}</h2><p style={{whiteSpace:'pre-wrap'}}>{a.contenido}</p><small>{new Date(a.fecha).toLocaleDateString('es-PE')}</small>{gestion&&<button onClick={()=>archivar(a.id)}>Archivar</button>}</article>)}</section>;
}
