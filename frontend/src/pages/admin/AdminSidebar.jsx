function AdminSidebar({
  seccionAdmin,
  setSeccionAdmin,
  menuAbierto,
  setMenuAbierto,
}) {
  function cambiarSeccion(seccion) {
    setSeccionAdmin(seccion);
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
        <span>Panel administrador</span>
      </div>

      <nav className="sidebar-menu">
        <button
          className={seccionAdmin === "socios" ? "activo" : ""}
          onClick={() => cambiarSeccion("socios")}
        >
          Socios
        </button>

        <button
          className={seccionAdmin === "pagos" ? "activo" : ""}
          onClick={() => cambiarSeccion("pagos")}
        >
          Pagos
        </button>
      </nav>

      <a className="cerrar-sesion" href="/">
        Cerrar sesión
      </a>
    </aside>
  );
}

export default AdminSidebar;