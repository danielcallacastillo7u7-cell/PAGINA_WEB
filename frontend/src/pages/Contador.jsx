import { useState } from "react";
import "./Panel.css";
import Dashboard from "./Jefe/dashboard.jsx";
import Cuotas from "./Jefe/Cuotas.jsx";
import Pagos from "./Jefe/Pagos.jsx";
import Finanzas from "./Jefe/Finanzas.jsx";
import Reportes from "./Jefe/Reportes.jsx";

function ContadorSidebar({ seccion, setSeccion, menuAbierto, setMenuAbierto }) {
  function cambiarSeccion(nombre) {
    setSeccion(nombre);
    setMenuAbierto(false);
  }

  function cerrarSesion() {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    window.location.href = "/login";
  }

  return (
    <aside className={`admin-sidebar ${menuAbierto ? "abierto" : ""}`}>
      <button className="admin-cerrar-menu-btn" onClick={() => setMenuAbierto(false)}>Cerrar</button>
      <div className="sidebar-logo">
        <h2>Club Catarindo</h2>
        <p>Panel del Contador</p>
      </div>

      <nav className="sidebar-menu">
        <button
          className={seccion === "dashboard" ? "activo" : ""}
          onClick={() => cambiarSeccion("dashboard")}
        >
          Dashboard
        </button>

        <button
          className={seccion === "cuotas" ? "activo" : ""}
          onClick={() => cambiarSeccion("cuotas")}
        >
          Cuotas
        </button>

        <button
          className={seccion === "pagos" ? "activo" : ""}
          onClick={() => cambiarSeccion("pagos")}
        >
          Pagos
        </button>

        <button
          className={seccion === "finanzas" ? "activo" : ""}
          onClick={() => cambiarSeccion("finanzas")}
        >
          Ingresos y Egresos
        </button>

        <button
          className={seccion === "reportes" ? "activo" : ""}
          onClick={() => cambiarSeccion("reportes")}
        >
          Reportes
        </button>
      </nav>

      <div className="admin-sidebar-footer">
        <button className="cerrar-sesion" onClick={cerrarSesion}>
          Cerrar sesion
        </button>
      </div>
    </aside>
  );
}

function Contador() {
  const [seccion, setSeccion] = useState("dashboard");
  const [menuAbierto, setMenuAbierto] = useState(false);

  return (
    <div className="admin-layout">
      <button
        className="admin-menu-mobile-btn"
        onClick={() => setMenuAbierto(true)}
      >
        Menu
      </button>

      {menuAbierto && (
        <div
          className="admin-menu-overlay"
          onClick={() => setMenuAbierto(false)}
        />
      )}

      <ContadorSidebar
        seccion={seccion}
        setSeccion={setSeccion}
        menuAbierto={menuAbierto}
        setMenuAbierto={setMenuAbierto}
      />

      <main className="admin-main">
        {seccion === "dashboard" && <Dashboard />}
        {seccion === "cuotas" && <Cuotas />}
        {seccion === "pagos" && <Pagos />}
        {seccion === "finanzas" && <Finanzas />}
        {seccion === "reportes" && <Reportes />}
      </main>
    </div>
  );
}

export default Contador;
