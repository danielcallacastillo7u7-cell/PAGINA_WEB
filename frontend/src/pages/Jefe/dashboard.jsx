import { useEffect, useState } from "react";

function Dashboard() {
  const [datos, setDatos] = useState({
    socios: 0,
    activos: 0,
    morosos: 0,
    pendientes: 0,
    recaudado: 0,
  });

  const [cargando, setCargando] = useState(true);

  async function cargarDashboard() {
    try {
      const respuesta = await fetch("http://localhost:3000/api/dashboard");

      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        alert(resultado.mensaje || "Error al cargar el dashboard");
        return;
      }

      setDatos(resultado);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarDashboard();
  }, []);

  return (
    <>
      <header className="admin-header">
        <div>
          <span>Panel del Jefe</span>

          <h1>Dashboard General</h1>

          <p>
            Visualiza el estado general del club, los socios y la recaudación.
          </p>
        </div>

        <button onClick={cargarDashboard}>Actualizar</button>
      </header>

      {cargando ? (
        <section className="panel-box">
          <p>Cargando información...</p>
        </section>
      ) : (
        <>
          <section className="dashboard-cards">
            <article className="dashboard-card">
              <span>Socios registrados</span>
              <strong>{datos.socios}</strong>
            </article>

            <article className="dashboard-card">
              <span>Socios activos</span>
              <strong>{datos.activos}</strong>
            </article>

            <article className="dashboard-card">
              <span>Morosos</span>
              <strong>{datos.morosos}</strong>
            </article>

            <article className="dashboard-card">
              <span>Pendientes</span>
              <strong>{datos.pendientes}</strong>
            </article>

            <article className="dashboard-card">
              <span>Recaudado</span>
              <strong>S/ {Number(datos.recaudado).toFixed(2)}</strong>
            </article>
          </section>

          <section className="panel-box">
            <h2>Resumen General</h2>

            <div className="socios-lista">
              <article className="socio-card">
                <div>
                  <h3>Total de socios</h3>
                  <p>Usuarios registrados en el sistema.</p>
                </div>

                <div className="socio-contacto">
                  <strong>{datos.socios}</strong>
                </div>
              </article>

              <article className="socio-card">
                <div>
                  <h3>Socios activos</h3>
                  <p>Socios habilitados para utilizar el club.</p>
                </div>

                <div className="socio-contacto">
                  <strong>{datos.activos}</strong>
                </div>
              </article>

              <article className="socio-card">
                <div>
                  <h3>Pagos pendientes</h3>
                  <p>Comprobantes esperando aprobación.</p>
                </div>

                <div className="socio-contacto">
                  <strong>{datos.pendientes}</strong>
                </div>
              </article>

              <article className="socio-card">
                <div>
                  <h3>Morosos</h3>
                  <p>Socios con pagos rechazados o deuda.</p>
                </div>

                <div className="socio-contacto">
                  <strong>{datos.morosos}</strong>
                </div>
              </article>

              <article className="socio-card">
                <div>
                  <h3>Total recaudado</h3>
                  <p>Pagos acreditados registrados.</p>
                </div>

                <div className="socio-contacto">
                  <strong>S/ {Number(datos.recaudado).toFixed(2)}</strong>
                </div>
              </article>
            </div>
          </section>
        </>
      )}
    </>
  );
}

export default Dashboard;