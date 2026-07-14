function UsuarioSidebar({
  seccionActiva,
  setSeccionActiva,
  menuAbierto,
  setMenuAbierto,
}) {
  function cambiarSeccion(seccion) {
    setSeccionActiva(seccion);
    setMenuAbierto(false);
  }

  return (
    <aside className={`usuario-sidebar ${menuAbierto ? "abierto" : ""}`}>
      <button className="cerrar-menu-btn" onClick={() => setMenuAbierto(false)}>
        Cerrar
      </button>

      <div className="usuario-logo">
        <h2>ClubCuotas</h2>
        <span>Portal del socio</span>
      </div>

      <nav className="usuario-menu">
        <button
          className={seccionActiva === "cuenta" ? "activo" : ""}
          onClick={() => cambiarSeccion("cuenta")}
        >
          Mi cuenta
        </button>

        <button
          className={seccionActiva === "cuotas" ? "activo" : ""}
          onClick={() => cambiarSeccion("cuotas")}
        >
          Mis cuotas
        </button>

        <button
          className={seccionActiva === "pagos" ? "activo" : ""}
          onClick={() => cambiarSeccion("pagos")}
        >
          Mis pagos
        </button>

        <button
          className={seccionActiva === "reservas" ? "activo" : ""}
          onClick={() => cambiarSeccion("reservas")}
        >
          Reservas
        </button>

        <button
          className={seccionActiva === "avisos" ? "activo" : ""}
          onClick={() => cambiarSeccion("avisos")}
        >
          Avisos
        </button>
      </nav>

      <a className="usuario-salir" href="/">
        Cerrar sesión
      </a>
    </aside>
  );
}

export default UsuarioSidebar;