function SocioDetalle({ socio, volver }) {
  if (!socio) return null;

  return (
    <>
      <header className="admin-header">
        <div>
          <span>Ficha del socio</span>

          <h1>{socio.nombre}</h1>

          <p>{socio.correo}</p>
        </div>

        <button onClick={volver}>
          ← Volver
        </button>
      </header>

      <section className="panel-box">

        <h2>Información general</h2>

        <div className="perfil-grid">

          <div>
            <span>ID</span>
            <strong>{socio.id}</strong>
          </div>

          <div>
            <span>Correo</span>
            <strong>{socio.correo}</strong>
          </div>

          <div>
            <span>Rol</span>
            <strong>{socio.rol}</strong>
          </div>

          <div>
            <span>Estado</span>

            <strong>
              {socio.estado ? "Activo" : "Inactivo"}
            </strong>

          </div>

        </div>

      </section>

      <section className="panel-box">

        <h2>Resumen financiero</h2>

        <div className="dashboard-cards">

          <article className="dashboard-card">
            <span>Total pagado</span>
            <strong>S/ 0.00</strong>
          </article>

          <article className="dashboard-card">
            <span>Debe</span>
            <strong>S/ 0.00</strong>
          </article>

          <article className="dashboard-card">
            <span>Cuotas</span>
            <strong>0</strong>
          </article>

          <article className="dashboard-card">
            <span>Pagos</span>
            <strong>0</strong>
          </article>

        </div>

      </section>

      <section className="panel-box">

        <h2>Acciones</h2>

        <div className="socio-acciones">

          <button>Editar información</button>

          <button>Ver historial</button>

          <button>Generar liquidación</button>

          <button>Enviar recordatorio</button>

        </div>

      </section>

    </>
  );
}

export default SocioDetalle;