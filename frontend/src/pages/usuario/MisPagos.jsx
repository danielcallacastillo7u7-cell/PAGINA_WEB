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
    if (!fecha) return "Sin fecha";

    return new Date(fecha).toLocaleString("es-PE", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  function formatearMonto(monto) {
    const numero = Number(monto || 0);

    if (numero <= 0) return "Pendiente de revision";

    return `S/ ${numero.toFixed(2)}`;
  }

  return (
    <section className="mis-pagos-page">
      <header className="perfil-header">
        <div>
          <span>Mis pagos</span>
          <h1>Historial de solicitudes</h1>
          <p>
            Revisa tus comprobantes enviados, fecha, hora, monto registrado y estado de validacion.
          </p>
        </div>
      </header>

      <section className="cuotas-box">
        <h2>Mis solicitudes</h2>

        <div className="mis-pagos-lista">
          {cargando ? (
            <p>Cargando solicitudes...</p>
          ) : pagos.length === 0 ? (
            <p>Todavia no tienes solicitudes registradas.</p>
          ) : (
            pagos.map((pago) => (
              <article className="mi-pago-card" key={pago.id}>
                <div>
                  <h3>Solicitud #{pago.id}</h3>
                  <p>{formatearFecha(pago.fecha_pago)}</p>
                </div>

                <div>
                  <span>Descripcion</span>
                  <strong>{pago.descripcion || "Sin descripcion"}</strong>
                </div>

                <div>
                  <span>Monto registrado</span>
                  <strong>{formatearMonto(pago.monto)}</strong>
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
                  <a href={pago.comprobante_url} target="_blank" rel="noreferrer">
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
