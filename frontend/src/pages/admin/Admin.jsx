import Padron from '../Padron.jsx';
import Comunidad from '../Comunidad.jsx';
import Mensajes from '../Mensajes.jsx';
import Reservas from '../Reservas.jsx';
import PagosCuotas from '../Jefe/Pagos.jsx';
import { useState } from "react";
import "../Panel.css";
import AdminSidebar from "./AdminSidebar.jsx";
import Socios from "./Socios.jsx";
import Pagos from "./Pagos.jsx";

function Admin() {
  const [seccionAdmin, setSeccionAdmin] = useState("socios");
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
        ></div>
      )}

      <AdminSidebar
        seccionAdmin={seccionAdmin}
        setSeccionAdmin={setSeccionAdmin}
        menuAbierto={menuAbierto}
        setMenuAbierto={setMenuAbierto}
      />

      <main className="admin-main">
        {seccionAdmin === 'padron' && <Padron />}
        {seccionAdmin === 'avisos' && <Comunidad gestion />}
        {seccionAdmin === 'mensajes' && <Mensajes />}
        {seccionAdmin === 'reservas' && <Reservas gestion />}
        {seccionAdmin === 'cuotas-pagos' && <PagosCuotas />}

        {seccionAdmin === "socios" && <Socios />}
        {seccionAdmin === "pagos" && <Pagos />}
      </main>
    </div>
  );
}

export default Admin;