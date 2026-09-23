import { useState } from 'react';
import { useRemote, jsonRequest } from '../hooks/useRemote.js';

const roles = ['jefe','admin','contador','usuario'];
const inicial = {nombre:'',correo:'',rol:'usuario',estado:true,password:''};
export default function CuentasAcceso() {
  const cuentas = useRemote('/api/cuentas');
  const actual = useRemote('/api/auth/me');
  const [form,setForm] = useState(null);
  const [buscar,setBuscar] = useState('');
  const [mensaje,setMensaje] = useState('');
  const [busy,setBusy] = useState(false);
  const propia = form?.id === actual.data?.usuario.id;
  const filas = cuentas.data?.filter(u=>`${u.nombre} ${u.correo} ${u.rol}`.toLowerCase().includes(buscar.toLowerCase())) || [];

  async function guardar(e) {
    e.preventDefault();
    if (form.id && !window.confirm('Guardar estos cambios cerrará las sesiones anteriores de esta cuenta. ¿Continuar?')) return;
    setBusy(true);setMensaje('');
    try {
      const r = await jsonRequest(form.id?`/api/cuentas/${form.id}`:'/api/auth/register',form.id?'PUT':'POST',form);
      if (propia) { localStorage.removeItem('token');localStorage.removeItem('usuario');window.location.assign('/login');return; }
      setMensaje(r.mensaje);setForm(null);cuentas.refresh();
    } catch(error) { setMensaje(error.message); }
    finally { setBusy(false); }
  }
  function campo(key,value) {setForm({...form,[key]:value});}
  return <section className="panel-box club-panel">
    <h1>Cuentas y roles</h1><p>Administra los accesos del equipo y de los socios. Las propiedades se vinculan desde el padrón.</p>
    <div className="club-actions"><input aria-label="Buscar cuenta" placeholder="Nombre, correo o rol" value={buscar} onChange={e=>setBuscar(e.target.value)}/><button onClick={()=>{setForm({...inicial});setMensaje('');}}>Crear cuenta</button><button onClick={cuentas.refresh}>Actualizar</button></div>
    {mensaje&&<p role="status">{mensaje}</p>}{cuentas.error&&<p role="alert">{cuentas.error}</p>}
    {form&&<form className="club-form" onSubmit={guardar}>
      <h2>{form.id?'Editar cuenta':'Nueva cuenta'}</h2>
      <label>Nombre<input required maxLength={100} value={form.nombre} onChange={e=>campo('nombre',e.target.value)}/></label>
      <label>Correo<input type="email" required maxLength={150} value={form.correo} onChange={e=>campo('correo',e.target.value)}/></label>
      <label>Rol<select value={form.rol} disabled={propia} onChange={e=>campo('rol',e.target.value)}>{roles.map(rol=><option key={rol}>{rol}</option>)}</select></label>
      {form.id?<label>Estado<select value={String(form.estado)} disabled={propia} onChange={e=>campo('estado',e.target.value==='true')}><option value="true">Activa</option><option value="false">Inactiva</option></select></label>:<label>Contraseña inicial<input type="password" autoComplete="new-password" required minLength={8} maxLength={72} value={form.password} onChange={e=>campo('password',e.target.value)}/></label>}
      {!form.id&&<p>Usa al menos 8 caracteres, mayúscula, minúscula, número y símbolo. El titular podrá cambiar su contraseña desde Mi acceso.</p>}
      {form.rol==='jefe'&&<p>El jefe necesita recibir un código por correo para entrar.</p>}
      <button disabled={busy}>{busy?'Guardando…':'Guardar cuenta'}</button><button type="button" disabled={busy} onClick={()=>setForm(null)}>Cancelar</button>
    </form>}
    {cuentas.loading?<p>Cargando cuentas…</p>:<div className="club-table"><table><thead><tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{filas.map(u=><tr key={u.id}><td>{u.nombre}</td><td>{u.correo}</td><td>{u.rol}</td><td>{u.estado?'Activa':'Inactiva'}</td><td><button onClick={()=>{setForm({...u});setMensaje('');}}>Editar</button></td></tr>)}</tbody></table>{!filas.length&&<p>No hay cuentas que coincidan.</p>}</div>}
  </section>;
}
