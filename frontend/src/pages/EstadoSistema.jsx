import { useRemote } from '../hooks/useRemote.js';
export default function EstadoSistema() {
  const r=useRemote('/api/configuracion');
  return <section className="panel-box club-panel"><h1>Estado del sistema</h1><button onClick={r.refresh}>Actualizar</button>{r.error&&<p role="alert">{r.error}</p>}{r.loading?<p>Comprobando…</p>:r.data&&<>
    <article className="club-item"><h2>Correo de acceso del jefe</h2><p>{r.data.correoConfigurado?'Credenciales configuradas. La entrega depende del servicio de correo.':'Pendiente de configurar. El jefe aún no podrá recibir su código.'}</p></article>
    <article className="club-item"><h2>Datos públicos del club</h2><p>{r.data.contactoConfigurado?'Teléfono, correo y dirección configurados.':'Falta completar teléfono, correo o dirección.'}</p></article>
    <article className="club-item"><h2>Comprobantes</h2><p>{r.data.almacenamientoExternoConfigurado?'Carpeta configurada. Debe contar con almacenamiento persistente y respaldo.':'Se usa la carpeta local del backend. Preparar almacenamiento persistente antes de publicarlo.'}</p></article>
  </>}</section>;
}
