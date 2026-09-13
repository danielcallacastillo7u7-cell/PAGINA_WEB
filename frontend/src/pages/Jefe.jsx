import { useState } from "react";

import "./Panel.css";

import Socios from "./Jefe/socios.jsx";
import Dashboard from "./Jefe/Dashboard.jsx";
import JefeSidebar from "./Jefe/JefeSidebar.jsx";
import Pagos from "./Jefe/Pagos.jsx";
import ImportarExcel from "./Jefe/ImportarExcel.jsx";
import Cuotas from "./Jefe/Cuotas.jsx";

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

        {seccion === "pagos" && (
          <Pagos />
        )}

        {seccion === "importar" && (
          <ImportarExcel />
        )}

        {seccion === "reportes" && (
          <section className="panel-box">
            <h1>Reportes</h1>
            <p>
              Aquí se mostrarán los reportes financieros del Club Catarindo.
            </p>
          </section>
        )}
        {seccion === "cuotas" && (<Cuotas />)}

      </main>

    </div>
  );
}

export default Jefe;