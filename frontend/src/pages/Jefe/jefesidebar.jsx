function JefeSidebar({
  seccion,
  setSeccion,
  menuAbierto,
  setMenuAbierto,
}) {

  const cambiarSeccion = (nombre) => {
    setSeccion(nombre);
    setMenuAbierto(false);
  };

  const cerrarSesion = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");

    window.location.href = "/login";
  };

  return (
    <aside
      className={`admin-sidebar ${
        menuAbierto ? "activo" : ""
      }`}
    >

      <div className="admin-sidebar-logo">
        <h2>Club Catarindo</h2>
        <p>Panel del Jefe</p>
      </div>

      <nav className="admin-sidebar-menu">

        <button
          className={
            seccion === "dashboard"
              ? "activo"
              : ""
          }
          onClick={() =>
            cambiarSeccion("dashboard")
          }
        >
          Dashboard
        </button>

        <button
          className={
            seccion === "socios"
              ? "activo"
              : ""
          }
          onClick={() =>
            cambiarSeccion("socios")
          }
        >
          Socios
        </button>

        <button
          className={
            seccion === "pagos"
              ? "activo"
              : ""
          }
          onClick={() =>
            cambiarSeccion("pagos")
          }
        >
          Pagos
        </button>

        <button
          className={
            seccion === "cuotas"
              ? "activo"
              : ""
          }
          onClick={() =>
            cambiarSeccion("cuotas")
          }
        >
          Cuotas
        </button>

        <button
          className={
            seccion === "reportes"
              ? "activo"
              : ""
          }
          onClick={() =>
            cambiarSeccion("reportes")
          }
        >
          Reportes
        </button>

        <button
          className={
            seccion === "importar"
              ? "activo"
              : ""
          }
          onClick={() =>
            cambiarSeccion("importar")
          }
        >
          Importar Excel
        </button>

      </nav>

      <div className="admin-sidebar-footer">

        <button
          className="btn-cerrar-sesion"
          onClick={cerrarSesion}
        >
          Cerrar sesión
        </button>

      </div>

    </aside>
  );
}

export default JefeSidebar;