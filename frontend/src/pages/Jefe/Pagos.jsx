import { useState } from "react";

function Pagos() {
  const [pagos, setPagos] = useState([
    {
      id: 1,
      socio: "Juan Pérez",
      correo: "juan.perez@gmail.com",
      telefono: "999 111 222",
      concepto: "Cuota mensual",
      monto: 180,
      fecha: "15/08/2026",
      metodo: "Yape",
      voucher: "https://placehold.co/600x800?text=Voucher+Juan",
      estado: "pendiente",
    },
    {
      id: 2,
      socio: "María López",
      correo: "maria.lopez@gmail.com",
      telefono: "999 333 444",
      concepto: "Cuota mensual",
      monto: 180,
      fecha: "16/08/2026",
      metodo: "Transferencia bancaria",
      voucher: "https://placehold.co/600x800?text=Voucher+Maria",
      estado: "pendiente",
    },
    {
      id: 3,
      socio: "Carlos Ramos",
      correo: "carlos.ramos@gmail.com",
      telefono: "999 555 666",
      concepto: "Cuota mensual",
      monto: 200,
      fecha: "16/08/2026",
      metodo: "Plin",
      voucher: "https://placehold.co/600x800?text=Voucher+Carlos",
      estado: "pendiente",
    },
  ]);

  const [pagoSeleccionado, setPagoSeleccionado] = useState(null);
  const [motivoRechazo, setMotivoRechazo] = useState("");
  const [mostrarRechazo, setMostrarRechazo] = useState(false);

  const pagosPendientes = pagos.filter(
    (pago) => pago.estado === "pendiente"
  );

  const pagosAprobados = pagos.filter(
    (pago) => pago.estado === "acreditado"
  );

  const pagosRechazados = pagos.filter(
    (pago) => pago.estado === "rechazado"
  );

  function aprobarPago(id) {
    setPagos((actuales) =>
      actuales.map((pago) =>
        pago.id === id
          ? {
              ...pago,
              estado: "acreditado",
            }
          : pago
      )
    );

    setPagoSeleccionado(null);

    alert("Pago aprobado correctamente.");
  }

  function abrirRechazo(pago) {
    setPagoSeleccionado(pago);
    setMotivoRechazo("");
    setMostrarRechazo(true);
  }

  function rechazarPago() {
    if (!motivoRechazo.trim()) {
      alert("Debes indicar el motivo del rechazo.");
      return;
    }

    setPagos((actuales) =>
      actuales.map((pago) =>
        pago.id === pagoSeleccionado.id
          ? {
              ...pago,
              estado: "rechazado",
              motivoRechazo,
            }
          : pago
      )
    );

    setMostrarRechazo(false);
    setPagoSeleccionado(null);
    setMotivoRechazo("");

    alert("Pago rechazado correctamente.");
  }

  function enviarComprobante(tipo) {
    if (!pagoSeleccionado) return;

    if (tipo === "correo") {
      alert(
        `Comprobante enviado al correo ${pagoSeleccionado.correo}`
      );
    }

    if (tipo === "telefono") {
      alert(
        `Comprobante enviado al número ${pagoSeleccionado.telefono}`
      );
    }
  }

  return (
    <div>
      <header className="admin-header">
        <div>
          <span>Panel del Jefe</span>
          <h1>Validación de pagos</h1>
          <p>
            Revisa y valida los comprobantes enviados por los socios.
          </p>
        </div>
      </header>

      <section className="dashboard-cards">

        <article className="dashboard-card">
          <span>Pendientes</span>
          <strong>{pagosPendientes.length}</strong>
        </article>

        <article className="dashboard-card">
          <span>Aprobados</span>
          <strong>{pagosAprobados.length}</strong>
        </article>

        <article className="dashboard-card">
          <span>Rechazados</span>
          <strong>{pagosRechazados.length}</strong>
        </article>

      </section>

      <section className="panel-box">

        <div className="panel-box-header">
          <div>
            <h2>Pagos pendientes</h2>
            <p>
              Comprobantes que necesitan ser revisados.
            </p>
          </div>
        </div>

        {pagosPendientes.length === 0 ? (
          <div className="estado-vacio">
            <strong>No hay pagos pendientes</strong>
            <p>
              Todos los comprobantes han sido revisados.
            </p>
          </div>
        ) : (
          <div className="pagos-lista">

            {pagosPendientes.map((pago) => (
              <article className="pago-card" key={pago.id}>

                <div className="pago-informacion">

                  <div>
                    <span>Socio</span>
                    <strong>{pago.socio}</strong>
                  </div>

                  <div>
                    <span>Concepto</span>
                    <strong>{pago.concepto}</strong>
                  </div>

                  <div>
                    <span>Monto</span>
                    <strong>
                      S/ {pago.monto.toFixed(2)}
                    </strong>
                  </div>

                  <div>
                    <span>Fecha</span>
                    <strong>{pago.fecha}</strong>
                  </div>

                  <div>
                    <span>Método</span>
                    <strong>{pago.metodo}</strong>
                  </div>

                </div>

                <div className="pago-acciones">

                  <button
                    onClick={() =>
                      setPagoSeleccionado(pago)
                    }
                  >
                    Ver voucher
                  </button>

                  <button
                    className="btn-aprobar"
                    onClick={() =>
                      aprobarPago(pago.id)
                    }
                  >
                    ✓ Aprobar
                  </button>

                  <button
                    className="btn-rechazar"
                    onClick={() =>
                      abrirRechazo(pago)
                    }
                  >
                    ✕ Rechazar
                  </button>

                </div>

              </article>
            ))}

          </div>
        )}

      </section>

      {pagoSeleccionado && !mostrarRechazo && (
        <div className="modal-fondo">

          <div className="modal-contenido">

            <button
              className="modal-cerrar"
              onClick={() =>
                setPagoSeleccionado(null)
              }
            >
              ×
            </button>

            <span>Comprobante de pago</span>

            <h2>{pagoSeleccionado.socio}</h2>

            <div className="voucher-informacion">

              <p>
                <strong>Concepto:</strong>{" "}
                {pagoSeleccionado.concepto}
              </p>

              <p>
                <strong>Monto:</strong>{" "}
                S/ {pagoSeleccionado.monto.toFixed(2)}
              </p>

              <p>
                <strong>Fecha:</strong>{" "}
                {pagoSeleccionado.fecha}
              </p>

              <p>
                <strong>Método:</strong>{" "}
                {pagoSeleccionado.metodo}
              </p>

            </div>

            <img
              className="voucher-imagen"
              src={pagoSeleccionado.voucher}
              alt="Comprobante de pago"
            />

            <div className="modal-acciones">

              <button
                className="btn-aprobar"
                onClick={() =>
                  aprobarPago(pagoSeleccionado.id)
                }
              >
                ✓ Aprobar pago
              </button>

              <button
                className="btn-rechazar"
                onClick={() =>
                  abrirRechazo(pagoSeleccionado)
                }
              >
                ✕ Rechazar pago
              </button>

            </div>

            <hr />

            <h3>Enviar comprobante</h3>

            <p>
              El comprobante puede ser enviado al socio
              mediante sus datos registrados.
            </p>

            <div className="envio-comprobante">

              <button
                onClick={() =>
                  enviarComprobante("correo")
                }
              >
                📧 Enviar por correo
              </button>

              <button
                onClick={() =>
                  enviarComprobante("telefono")
                }
              >
                📱 Enviar al teléfono
              </button>

            </div>

          </div>

        </div>
      )}

      {mostrarRechazo && pagoSeleccionado && (
        <div className="modal-fondo">

          <div className="modal-contenido">

            <button
              className="modal-cerrar"
              onClick={() =>
                setMostrarRechazo(false)
              }
            >
              ×
            </button>

            <span>Rechazar comprobante</span>

            <h2>{pagoSeleccionado.socio}</h2>

            <p>
              Indica el motivo por el cual el comprobante
              no puede ser aprobado.
            </p>

            <textarea
              className="motivo-rechazo"
              placeholder="Ejemplo: El monto del comprobante no coincide con la cuota registrada."
              value={motivoRechazo}
              onChange={(e) =>
                setMotivoRechazo(e.target.value)
              }
              rows="5"
            />

            <div className="modal-acciones">

              <button
                onClick={() =>
                  setMostrarRechazo(false)
                }
              >
                Cancelar
              </button>

              <button
                className="btn-rechazar"
                onClick={rechazarPago}
              >
                Confirmar rechazo
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

export default Pagos;