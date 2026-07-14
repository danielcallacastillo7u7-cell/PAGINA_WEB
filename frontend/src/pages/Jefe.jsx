import "./Panel.css";

function Jefe() {
  return (
    <div className="panel">
      <aside className="sidebar">
        <h2>Club Residencial</h2>
        <nav>
          <a href="#">Inicio</a>
          <a href="#">Personal</a>
          <a href="#">Actividades</a>
          <a href="#">Reservas</a>
          <a href="#">Reportes</a>
        </nav>
        <a className="salir" href="/">Cerrar sesión</a>
      </aside>

      <main className="panel-main">
        <header className="panel-header">
          <div>
            <span>Panel de jefe</span>
            <h1>Supervisión del club</h1>
          </div>
          <button>Crear actividad</button>
        </header>

        <section className="resumen">
          <div className="resumen-card">
            <span>Personal activo</span>
            <strong>16</strong>
          </div>
          <div className="resumen-card">
            <span>Actividades hoy</span>
            <strong>7</strong>
          </div>
          <div className="resumen-card">
            <span>Reservas supervisadas</span>
            <strong>21</strong>
          </div>
          <div className="resumen-card">
            <span>Incidencias</span>
            <strong>2</strong>
          </div>
        </section>

        <section className="contenido-grid">
          <div className="panel-card grande">
            <h2>Actividades del día</h2>
            <div className="tabla">
              <div>
                <strong>Mantenimiento de piscina</strong>
                <span>Equipo operativo - 8:00 AM</span>
              </div>
              <div>
                <strong>Revisión de áreas verdes</strong>
                <span>Personal de mantenimiento - 10:30 AM</span>
              </div>
              <div>
                <strong>Evento en salón social</strong>
                <span>Supervisión general - 6:00 PM</span>
              </div>
            </div>
          </div>

          <div className="panel-card">
            <h2>Acciones</h2>
            <div className="acciones">
              <button>Asignar personal</button>
              <button>Ver reportes</button>
              <button>Registrar incidencia</button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Jefe;