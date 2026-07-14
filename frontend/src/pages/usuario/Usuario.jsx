import { useState } from "react";
import "../Usuario.css";
import UsuarioSidebar from "./UsuarioSidebar.jsx";
import MiCuenta from "./MiCuenta.jsx";
import MisCuotas from "./MisCuotas.jsx";
import ModuloVacio from "./ModuloVacio.jsx";
import MisPagos from "./MisPagos.jsx";

function Usuario() {
  const [seccionActiva, setSeccionActiva] = useState("cuenta");
  const [menuAbierto, setMenuAbierto] = useState(false);

  const usuario = JSON.parse(localStorage.getItem("usuario"));

  return (
    <div className="usuario-layout">
      <button className="menu-mobile-btn" onClick={() => setMenuAbierto(true)}>
        Menú
      </button>

      {menuAbierto && (
        <div className="menu-overlay" onClick={() => setMenuAbierto(false)} />
      )}

      <UsuarioSidebar
        seccionActiva={seccionActiva}
        setSeccionActiva={setSeccionActiva}
        menuAbierto={menuAbierto}
        setMenuAbierto={setMenuAbierto}
      />

      <main className="usuario-main">
        {seccionActiva === "cuenta" && <MiCuenta usuario={usuario} />}
        {seccionActiva === "cuotas" && <MisCuotas />}
        {seccionActiva === "pagos" && <MisPagos />}
        {seccionActiva === "avisos" && <ModuloVacio titulo="Avisos" />}
      </main>
    </div>
  );
}

export default Usuario;