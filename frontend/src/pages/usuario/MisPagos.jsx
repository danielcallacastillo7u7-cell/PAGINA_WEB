import { useEffect, useState } from "react";

function MisPagos() {
  const usuario = JSON.parse(localStorage.getItem("usuario"));

  const [pagos, setPagos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargarMisPagos() {
      try {
        if (!usuario?.id) return;

        const respuesta = await fetch(
          `http://localhost:3000/api/pagos/usuario/${usuario.id}`
        );

        const datos = await respuesta.json();
        setPagos(datos);
      } catch (error) {
        console.error("Error cargando mis pagos:", error);
      } finally {
        setCargando(false);
      }
    }

    cargarMisPagos();
  }, [usuario?.id]);

  function formatearFecha(fecha) {
    return new Date(fecha).toLocaleString("es-PE", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  return (
    <section className="mis-pagos-page">
      <header className="perfil-header">
        <div>
          <span>Mis pagos</span>
          <h1>Historial de movimientos</h1>
          <p>
            Revisa todos tus pagos enviados, comprobantes, fechas, horas y
            estado de validación.
          </p>
        </div>
      </header>

      <section className="cuotas-box">
        <h2>Mis movimientos</h2>

        <div className="mis-pagos-lista">
          {cargando ? (
            <p>Cargando pagos...</p>
          ) : pagos.length === 0 ? (
            <p>Todavía no tienes pagos registrados.</p>
          ) : (
            pagos.map((pago) => (
              <article className="mi-pago-card" key={pago.id}>
                <div>
                  <h3>Pago #{pago.id}</h3>
                  <p>{formatearFecha(pago.fecha_pago)}</p>
                </div>

                <div>
                  <span>Monto</span>
                  <strong>S/ {pago.monto}</strong>
                </div>

                <div>
                  <span>Método</span>
                  <strong>{pago.metodo}</strong>
                </div>

                <em
                  className={
                    pago.estado === "acreditado"
                      ? "acreditado"
                      : pago.estado === "rechazado"
                      ? "rechazado"
                      : "procesando"
                  }
                >
                  {pago.estado}
                </em>

                {pago.comprobante_url ? (
                  <a
                    href={pago.comprobante_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Ver comprobante
                  </a>
                ) : (
                  <span>Sin comprobante</span>
                )}
              </article>
            ))
          )}
        </div>
      </section>
    </section>
  );
}

export default MisPagos;