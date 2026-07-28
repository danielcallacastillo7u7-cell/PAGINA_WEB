function JefeSidebar({
  seccion,
  setSeccion,
  menuAbierto,
  setMenuAbierto,
}) {
  function cambiar(nombre) {
    setSeccion(nombre);
    setMenuAbierto(false);
  }

  return (
    <aside className={`admin-sidebar ${menuAbierto ? "abierto" : ""}`}>

      <button
        className="admin-cerrar-menu-btn"
        onClick={() => setMenuAbierto(false)}
      >
        Cerrar
      </button>

      <div className="sidebar-logo">

        <h2>ClubCuotas</h2>

        <span>Panel del jefe</span>

      </div>

      <nav className="sidebar-menu">

        <button
          className={seccion === "dashboard" ? "activo" : ""}
          onClick={() => cambiar("dashboard")}
        >
          Dashboard
        </button>

        <button
          className={seccion === "socios" ? "activo" : ""}
          onClick={() => cambiar("socios")}
        >
          Socios
        </button>

        <button
          className={seccion === "cuotas" ? "activo" : ""}
          onClick={() => cambiar("cuotas")}
        >
          Cuotas
        </button>

        <button
          className={seccion === "reportes" ? "activo" : ""}
          onClick={() => cambiar("reportes")}
        >
          Reportes
        </button>

      </nav>

      <a className="cerrar-sesion" href="/">
        Cerrar sesión
      </a>

    </aside>
  );
}

export default JefeSidebar;