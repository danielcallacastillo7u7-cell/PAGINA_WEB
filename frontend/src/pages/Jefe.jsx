import { useState } from "react";

import "./Panel.css";

import Socios from "./Jefe/socios.jsx";
import Dashboard from "./Jefe/dashboard.jsx";
import JefeSidebar from "./Jefe/jefesidebar.jsx";
import Pagos from "./Jefe/Pagos.jsx";
import ImportarExcel from "./Jefe/ImportarExcel.jsx";
import Cuotas from "./Jefe/Cuotas.jsx";
import Finanzas from "./Jefe/Finanzas.jsx";
import Reportes from "./Jefe/Reportes.jsx";

function Jefe() {
  const [seccion, setSeccion] = useState("dashboard");
  const [menuAbierto, setMenuAbierto] = useState(false);

  return (
    <div className="admin-layout">

      <button
        className="admin-menu-mobile-btn"
        onClick={() => setMenuAbierto(true)}
      >
        Menú
      </button>

      {menuAbierto && (
        <div
          className="admin-sidebar-overlay"
          onClick={() => setMenuAbierto(false)}
        />
      )}

      <JefeSidebar
        seccion={seccion}
        setSeccion={setSeccion}
        menuAbierto={menuAbierto}
        setMenuAbierto={setMenuAbierto}
      />

      <main className="admin-main">

        {seccion === "dashboard" && (
          <Dashboard />
        )}

        {seccion === "socios" && (
          <Socios />
        )}

        {seccion === "cuotas" && (
          <Cuotas />
        )}

        {seccion === "pagos" && (
          <Pagos />
        )}

        {seccion === "finanzas" && (
          <Finanzas />
        )}

        {seccion === "reportes" && (
          <Reportes />
        )}

        {seccion === "importar" && (
          <ImportarExcel />
        )}

      </main>

    </div>
  );
}

export default Jefe;
