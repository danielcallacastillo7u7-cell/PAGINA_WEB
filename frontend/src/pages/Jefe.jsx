import { useState } from "react";

import "./Panel.css";

import Socios from "./jefe/Socios";
import Dashboard from "./jefe/Dashboard";
import JefeSidebar from "./jefe/JefeSidebar";

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
          className="admin-menu-overlay"
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

        {seccion === "dashboard" && <Dashboard />}
        {seccion==="socios" && <Socios />}

      </main>

    </div>
  );
}

export default Jefe;