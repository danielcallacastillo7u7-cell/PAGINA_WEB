function MiCuenta({ usuario }) {
  return (
    <section className="perfil">
      <header className="perfil-header">
        <div>
          <span>Mi cuenta</span>
          <h1>Perfil del socio</h1>
          <p>Información básica de tu cuenta registrada en el club.</p>
        </div>
      </header>

      <div className="perfil-card">
        <div className="perfil-avatar">
          {usuario?.nombre ? usuario.nombre.charAt(0).toUpperCase() : "S"}
        </div>

        <div className="perfil-info">
          <h2>{usuario?.nombre || "Socio"}</h2>
          <p>{usuario?.correo || "Correo no disponible"}</p>

          <div className="perfil-grid">
            <div>
              <span>Código</span>
              <strong>#{usuario?.id || "-"}</strong>
            </div>

            <div>
              <span>Rol</span>
              <strong>{usuario?.rol || "usuario"}</strong>
            </div>

            <div>
              <span>Estado</span>
              <strong>Activo</strong>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default MiCuenta;