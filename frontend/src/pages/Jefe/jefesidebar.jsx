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
      className={`admin-sidebar ${menuAbierto ? "abierto" : ""}`}
    >

      <button className="admin-cerrar-menu-btn" onClick={() => setMenuAbierto(false)}>Cerrar</button>
      <div className="sidebar-logo">
        <h2>Club Catarindo</h2>
        <p>Panel del Jefe</p>
      </div>

      <nav className="sidebar-menu">

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
            seccion === "finanzas"
              ? "activo"
              : ""
          }
          onClick={() =>
            cambiarSeccion("finanzas")
          }
        >
          Ingresos y Egresos
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
          Migrar datos históricos
        </button>

        {[['padron','Gestionar padrón'],['cuentas','Cuentas y roles'],['solicitudes','Comprobantes anteriores'],['avisos','Avisos'],['mensajes','Mensajes'],['reservas','Reservas'],['acceso','Mi acceso'],['estado','Estado del sistema']].map(([id,label]) => <button key={id} className={seccion===id?'activo':''} onClick={()=>cambiarSeccion(id)}>{label}</button>)}
      </nav>

      <div className="admin-sidebar-footer">

        <button
          className="cerrar-sesion"
          onClick={cerrarSesion}
        >
          Cerrar sesión
        </button>

      </div>

    </aside>
  );
}

export default JefeSidebar;