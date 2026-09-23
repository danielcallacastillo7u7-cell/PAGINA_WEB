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
        <h2>Club Catarindo</h2>
        <span>Panel administrador</span>
      </div>

      <nav className="sidebar-menu">
        <button
          className={seccionAdmin === "socios" ? "activo" : ""}
          onClick={() => cambiarSeccion("socios")}
        >
          Cuentas de socios
        </button>

        <button
          className={seccionAdmin === "pagos" ? "activo" : ""}
          onClick={() => cambiarSeccion("pagos")}
        >
          Comprobantes anteriores
        </button>
        {[['padron','Padrón'],['cuotas-pagos','Pagos de cuotas'],['avisos','Avisos'],['mensajes','Mensajes'],['reservas','Reservas'],['acceso','Mi acceso']].map(([id,label])=><button key={id} className={seccionAdmin===id?"activo":""} onClick={()=>cambiarSeccion(id)}>{label}</button>)}
      </nav>

      <a className="cerrar-sesion" href="/login" onClick={() => { localStorage.removeItem("token"); localStorage.removeItem("usuario"); }}>
        Cerrar sesión
      </a>
    </aside>
  );
}

export default AdminSidebar;