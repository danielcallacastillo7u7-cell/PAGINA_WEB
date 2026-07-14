import "./Panel.css";

function Contador() {
  return (
    <div className="panel">
      <aside className="sidebar">
        <h2>Club Residencial</h2>
        <nav>
          <a href="#">Inicio</a>
          <a href="#">Pagos</a>
          <a href="#">Ingresos</a>
          <a href="#">Deudas</a>
          <a href="#">Reportes</a>
        </nav>
        <a className="salir" href="/">Cerrar sesión</a>
      </aside>

      <main className="panel-main">
        <header className="panel-header">
          <div>
            <span>Panel contable</span>
            <h1>Gestión de pagos</h1>
          </div>
          <button>Registrar pago</button>
        </header>

        <section className="resumen">
          <div className="resumen-card">
            <span>Ingresos del mes</span>
            <strong>S/ 18,450</strong>
          </div>
          <div className="resumen-card">
            <span>Pagos pendientes</span>
            <strong>14</strong>
          </div>
          <div className="resumen-card">
            <span>Deudas vencidas</span>
            <strong>5</strong>
          </div>
          <div className="resumen-card">
            <span>Comprobantes</span>
            <strong>86</strong>
          </div>
        </section>

        <section className="contenido-grid">
          <div className="panel-card grande">
            <h2>Últimos movimientos</h2>
            <div className="tabla">
              <div>
                <strong>Pago de membresía</strong>
                <span>Juan Pérez - S/ 250</span>
              </div>
              <div>
                <strong>Reserva de salón</strong>
                <span>María López - S/ 400</span>
              </div>
              <div>
                <strong>Cuota mensual</strong>
                <span>Carlos Ramos - S/ 180</span>
              </div>
            </div>
          </div>

          <div className="panel-card">
            <h2>Acciones</h2>
            <div className="acciones">
              <button>Registrar pago</button>
              <button>Ver deudas</button>
              <button>Generar reporte</button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Contador;