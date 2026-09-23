import { useState } from 'react';
import { jsonRequest } from '../hooks/useRemote.js';
export default function MiAcceso() {
  const [mensaje,setMensaje] = useState('');
  const [busy,setBusy] = useState(false);
  async function guardar(e) {
    e.preventDefault();const datos=Object.fromEntries(new FormData(e.currentTarget));
    if(datos.nueva!==datos.confirmar){setMensaje('Las contraseñas nuevas no coinciden.');return;}
    setBusy(true);setMensaje('');
    try {
      await jsonRequest('/api/auth/cambiar-password','POST',{actual:datos.actual,nueva:datos.nueva});
      localStorage.removeItem('token');localStorage.removeItem('usuario');
      window.alert('Contraseña actualizada. Vuelve a iniciar sesión.');window.location.assign('/login');
    } catch(error) {setMensaje(error.message);} finally {setBusy(false);}
  }
  return <section className="panel-box club-panel"><h1>Mi acceso</h1><p>Cambia tu contraseña. Al guardarla se cerrarán tus sesiones en todos los dispositivos.</p>{mensaje&&<p role="alert">{mensaje}</p>}
    <form className="club-form" onSubmit={guardar}>
      <label>Contraseña actual<input name="actual" type="password" autoComplete="current-password" required/></label>
      <label>Nueva contraseña<input name="nueva" type="password" autoComplete="new-password" required minLength={8} maxLength={72}/></label>
      <label>Repetir nueva contraseña<input name="confirmar" type="password" autoComplete="new-password" required minLength={8} maxLength={72}/></label>
      <p>Al menos 8 caracteres, mayúscula, minúscula, número y símbolo.</p><button disabled={busy}>{busy?'Guardando…':'Cambiar contraseña'}</button>
    </form>
  </section>;
}
