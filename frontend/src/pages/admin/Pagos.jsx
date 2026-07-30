import { useEffect, useState } from "react";

function Pagos() {
  const [vistaPagos, setVistaPagos] = useState("historial");
  const [pagos, setPagos] = useState([]);
  const [cargando, setCargando] = useState(true);

  async function cargarPagos() {
    try {
      setCargando(true);
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

  function pedirMonto(mensaje) {
    const monto = prompt(mensaje);

    if (monto === null) return null;

    const montoLimpio = monto.trim().replace(",", ".");
    const numero = Number(montoLimpio);

    if (montoLimpio === "" || Number.isNaN(numero) || numero < 0) {
      alert("Ingresa un monto valido. Ejemplo: 150 o 150.50");
      return null;
    }

    return numero;
  }

  async function aprobarPago(id) {
    const monto = pedirMonto("Monto pagado que se registrara en el historial:");
    if (monto === null) return;

    const confirmar = confirm(`Aprobar esta solicitud con monto S/ ${monto}?`);
    if (!confirmar) return;

    const respuesta = await fetch(`http://localhost:3000/api/pagos/${id}/aprobar`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ monto }),
    });

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      alert(resultado.mensaje || "No se pudo aprobar la solicitud");
      return;
    }

    alert("Solicitud aprobada correctamente");
    cargarPagos();
  }

  async function rechazarPago(id) {
    const monto = pedirMonto("Monto declarado en el comprobante rechazado. Si no aplica, escribe 0:");
    if (monto === null) return;

    const confirmar = confirm(`Rechazar esta solicitud y guardar monto S/ ${monto}?`);
    if (!confirmar) return;

    const respuesta = await fetch(`http://localhost:3000/api/pagos/${id}/rechazar`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ monto }),
    });

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      alert(resultado.mensaje || "No se pudo rechazar la solicitud");
      return;
    }

    alert("Solicitud rechazada correctamente");
    cargarPagos();
  }

  function formatearFecha(fecha) {
    if (!fecha) return "Sin fecha";

    return new Date(fecha).toLocaleString("es-PE", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  function formatearMonto(monto) {
    return `S/ ${Number(monto || 0).toFixed(2)}`;
  }

  function limpiarCsv(valor) {
    return `"${String(valor ?? "").replace(/"/g, '""')}"`;
  }

  function descargarExcel() {
    if (pagos.length === 0) {
      alert("No hay datos para descargar");
      return;
    }

    const encabezados = [
      "Nombre",
      "Correo",
      "Descripcion",
      "Monto pagado",
      "Estado",
      "Fecha",
    ];

    const filas = pagos.map((pago) => [
      pago.socio,
      pago.correo,
      pago.descripcion || "Sin descripcion",
      formatearMonto(pago.monto),
      pago.estado,
      formatearFecha(pago.fecha_pago),
    ]);

    const contenido = [encabezados, ...filas]
      .map((fila) => fila.map(limpiarCsv).join(";"))
      .join("\n");

    const archivo = new Blob(["\uFEFF" + contenido], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(archivo);
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = "historial_pagos_clubcuotas.csv";
    enlace.click();
    URL.revokeObjectURL(url);
  }

  const pagosFiltrados = pagos.filter((pago) => {
    if (vistaPagos === "historial") return true;
    if (vistaPagos === "pendientes") return pago.estado === "procesando";
    if (vistaPagos === "rechazados") return pago.estado === "rechazado";
    return true;
  });

  return (
    <>
      <header className="admin-header">
        <div>
          <span>Panel del Administrador</span>
          <h1>Solicitudes de Pago</h1>
          <p>
            Revisa comprobantes enviados por socios, registra el monto real y aprueba o rechaza la solicitud.
          </p>
        </div>

        <div className="admin-header-actions">
          <button onClick={cargarPagos}>Actualizar</button>
          <button onClick={descargarExcel}>Descargar Excel</button>
        </div>
      </header>

      <section className="panel-box">
        <div className="socio-acciones">
          <button onClick={() => setVistaPagos("historial")}>Historial</button>
          <button onClick={() => setVistaPagos("pendientes")}>Pendientes</button>
          <button onClick={() => setVistaPagos("rechazados")}>Rechazados</button>
        </div>
      </section>

      <section className="panel-box">
        <h2>
          {vistaPagos === "historial" && "Historial de solicitudes"}
          {vistaPagos === "pendientes" && "Solicitudes pendientes"}
          {vistaPagos === "rechazados" && "Solicitudes rechazadas"}
        </h2>

        <div className="socios-lista">
          {cargando ? (
            <p>Cargando solicitudes...</p>
          ) : pagosFiltrados.length === 0 ? (
            <p>No hay solicitudes para mostrar.</p>
          ) : (
            pagosFiltrados.map((pago) => (
              <article className="socio-card" key={pago.id}>
                <div>
                  <h3>{pago.socio}</h3>
                  <p>{pago.correo}</p>
                  <span>{pago.descripcion || "Sin descripcion"}</span>
                  <p className="pago-fecha">Enviado: {formatearFecha(pago.fecha_pago)}</p>
                </div>

                <div className="socio-contacto">
                  <strong>Solicitud #{pago.id}</strong>
                  <span>{formatearMonto(pago.monto)}</span>
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
                      <button onClick={() => aprobarPago(pago.id)}>Aprobar</button>
                      <button onClick={() => rechazarPago(pago.id)}>Rechazar</button>
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

