import { useEffect, useState } from "react";

function Pagos() {
  const [vistaPagos, setVistaPagos] = useState("historial");
  const [pagos, setPagos] = useState([]);
  const [cargando, setCargando] = useState(true);

  async function cargarPagos() {
    try {
      const respuesta = await fetch("http://localhost:3000/api/pagos");
      const datos = await respuesta.json();
      setPagos(datos);
    } catch (error) {
      console.error("Error cargando pagos:", error);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarPagos();
  }, []);

  async function aprobarPago(id) {
    const confirmar = confirm("¿Seguro que deseas aprobar este pago?");
    if (!confirmar) return;

    const respuesta = await fetch(
      `http://localhost:3000/api/pagos/${id}/aprobar`,
      { method: "PATCH" }
    );

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      alert(resultado.mensaje || "No se pudo aprobar el pago");
      return;
    }

    alert("Pago aprobado correctamente");
    cargarPagos();
  }

  async function rechazarPago(id) {
    const confirmar = confirm("¿Seguro que deseas rechazar este pago?");
    if (!confirmar) return;

    const respuesta = await fetch(
      `http://localhost:3000/api/pagos/${id}/rechazar`,
      { method: "PATCH" }
    );

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      alert(resultado.mensaje || "No se pudo rechazar el pago");
      return;
    }

    alert("Pago rechazado correctamente");
    cargarPagos();
  }

  const pagosFiltrados = pagos.filter((pago) => {
    if (vistaPagos === "historial") return true;
    if (vistaPagos === "morosidad") return pago.estado === "rechazado";
    if (vistaPagos === "deudas") return pago.estado === "procesando";
    return true;
  });

  return (
    <>
      <header className="admin-header">
        <div>
          <span>Panel del Administrador</span>
          <h1>Gestión de Pagos</h1>
          <p>
            Revisa comprobantes enviados por socios, aprueba pagos o recházalos.
          </p>
        </div>

        <button onClick={cargarPagos}>Actualizar</button>
      </header>

      <section className="panel-box">
        <div className="socio-acciones">
          <button onClick={() => setVistaPagos("historial")}>
            Historial de pagos
          </button>

          <button onClick={() => setVistaPagos("deudas")}>
            Pendientes
          </button>

          <button onClick={() => setVistaPagos("morosidad")}>
            Rechazados
          </button>
        </div>
      </section>

      <section className="panel-box">
        <h2>
          {vistaPagos === "historial" && "Historial de pagos"}
          {vistaPagos === "deudas" && "Pagos pendientes de validación"}
          {vistaPagos === "morosidad" && "Pagos rechazados"}
        </h2>

        <div className="socios-lista">
          {cargando ? (
            <p>Cargando pagos...</p>
          ) : pagosFiltrados.length === 0 ? (
            <p>No hay pagos para mostrar.</p>
          ) : (
            pagosFiltrados.map((pago) => (
              <article className="socio-card" key={pago.id}>
                <div>
                  <h3>{pago.socio}</h3>
                  <p>{pago.correo}</p>
                  <span>Método: {pago.metodo}</span>
                </div>

                <div className="socio-contacto">
                  <strong>S/ {pago.monto}</strong>
                  <em
                    className={
                      pago.estado === "acreditado"
                        ? "activo"
                        : pago.estado === "rechazado"
                        ? "inactivo"
                        : "pendiente"
                    }
                  >
                    {pago.estado}
                  </em>
                </div>

                <div className="socio-acciones">
                  {pago.comprobante_url && (
                    <a
                      className="boton-link"
                      href={pago.comprobante_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Ver comprobante
                    </a>
                  )}

                  {pago.estado === "procesando" && (
                    <>
                      <button onClick={() => aprobarPago(pago.id)}>
                        Aprobar
                      </button>

                      <button onClick={() => rechazarPago(pago.id)}>
                        Rechazar
                      </button>
                    </>
                  )}
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </>
  );
}

export default Pagos;