import {
  useCallback,
  useEffect,
  useState,
} from "react";

const MESES = [
  "",
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

function Pagos() {
  const hoy =
    new Date()
      .toISOString()
      .split("T")[0];

  const [pagos, setPagos] =
    useState([]);

  const [resumen, setResumen] =
    useState({
      total: 0,
      pendientes: 0,
      aprobados: 0,
      rechazados: 0,
      totalAprobado: 0,
    });

  const [
    cuotasPendientes,
    setCuotasPendientes,
  ] = useState([]);

  const [estado, setEstado] =
    useState("");

  const [buscar, setBuscar] =
    useState("");

  const [cargando, setCargando] =
    useState(true);

  const [
    mostrarFormulario,
    setMostrarFormulario,
  ] = useState(false);

  const [formulario, setFormulario] =
    useState({
      cuotaId: "",
      monto: "",
      fechaPago: hoy,
      metodoPago: "",
      numeroRecibo: "",
      referencia: "",
      observacion: "",
    });


  const dinero =
    (valor) =>
      Number(
        valor || 0
      ).toLocaleString(
        "es-PE",
        {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }
      );


  const fecha =
    (valor) => {
      if (!valor) return "-";

      return new Date(
        valor
      ).toLocaleDateString(
        "es-PE"
      );
    };


  const cargarPagos =
    useCallback(
      async () => {
        try {
          setCargando(true);

          const parametros =
            new URLSearchParams();

          if (estado) {
            parametros.append(
              "estado",
              estado
            );
          }

          if (buscar.trim()) {
            parametros.append(
              "buscar",
              buscar.trim()
            );
          }

          const respuesta =
            await fetch(
              `http://localhost:3000/api/pagos?${parametros.toString()}`
            );

          const datos =
            await respuesta.json();

          if (!respuesta.ok) {
            throw new Error(
              datos.mensaje
            );
          }

          setPagos(datos);

        } catch (error) {
          console.error(
            "Error pagos:",
            error
          );

        } finally {
          setCargando(false);
        }
      },
      [
        estado,
        buscar,
      ]
    );


  const cargarResumen =
    async () => {
      try {
        const respuesta =
          await fetch(
            "http://localhost:3000/api/pagos/resumen"
          );

        const datos =
          await respuesta.json();

        if (respuesta.ok) {
          setResumen(datos);
        }

      } catch (error) {
        console.error(
          "Error resumen:",
          error
        );
      }
    };


  const cargarCuotasPendientes =
    async () => {
      try {
        const respuesta =
          await fetch(
            "http://localhost:3000/api/pagos/cuotas-pendientes"
          );

        const datos =
          await respuesta.json();

        if (respuesta.ok) {
          setCuotasPendientes(
            datos
          );
        }

      } catch (error) {
        console.error(
          "Error cuotas:",
          error
        );
      }
    };


  useEffect(() => {
    const temporizador =
      setTimeout(
        cargarPagos,
        300
      );

    return () =>
      clearTimeout(
        temporizador
      );

  }, [
    cargarPagos,
  ]);


  useEffect(() => {
    cargarResumen();
    cargarCuotasPendientes();
  }, []);


  const seleccionarCuota =
    (e) => {
      const cuotaId =
        e.target.value;

      const cuota =
        cuotasPendientes.find(
          (item) =>
            String(item.id) ===
            String(cuotaId)
        );

      setFormulario(
        (anterior) => ({
          ...anterior,

          cuotaId,

          monto:
            cuota
              ? cuota.monto
              : "",
        })
      );
    };


  const registrarPago =
    async (e) => {
      e.preventDefault();

      if (
        !formulario.cuotaId ||
        !formulario.monto ||
        !formulario.fechaPago ||
        !formulario.metodoPago
      ) {
        alert(
          "Completa los campos obligatorios."
        );

        return;
      }

      try {
        const respuesta =
          await fetch(
            "http://localhost:3000/api/pagos",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify(
                  formulario
                ),
            }
          );

        const datos =
          await respuesta.json();

        if (!respuesta.ok) {
          alert(
            datos.mensaje ||
              "No se pudo registrar."
          );

          return;
        }

        alert(
          datos.mensaje
        );

        setFormulario({
          cuotaId: "",
          monto: "",
          fechaPago: hoy,
          metodoPago: "",
          numeroRecibo: "",
          referencia: "",
          observacion: "",
        });

        setMostrarFormulario(
          false
        );

        await Promise.all([
          cargarPagos(),
          cargarResumen(),
          cargarCuotasPendientes(),
        ]);

      } catch (error) {
        console.error(error);

        alert(
          "No se pudo conectar con el servidor."
        );
      }
    };


  const aprobarPago =
    async (pago) => {
      const confirmar =
        window.confirm(
          `¿Aprobar el pago de ${pago.nombre} por S/ ${dinero(pago.monto)}?`
        );

      if (!confirmar) {
        return;
      }

      try {
        const respuesta =
          await fetch(
            `http://localhost:3000/api/pagos/${pago.id}/aprobar`,
            {
              method:
                "PATCH",
            }
          );

        const datos =
          await respuesta.json();

        if (!respuesta.ok) {
          alert(
            datos.mensaje
          );

          return;
        }

        alert(
          datos.mensaje
        );

        await Promise.all([
          cargarPagos(),
          cargarResumen(),
          cargarCuotasPendientes(),
        ]);

      } catch (error) {
        console.error(error);

        alert(
          "No se pudo aprobar el pago."
        );
      }
    };


  const rechazarPago =
    async (pago) => {
      const motivo =
        window.prompt(
          "Motivo del rechazo:"
        );

      if (motivo === null) {
        return;
      }

      try {
        const respuesta =
          await fetch(
            `http://localhost:3000/api/pagos/${pago.id}/rechazar`,
            {
              method:
                "PATCH",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  observacion:
                    motivo,
                }),
            }
          );

        const datos =
          await respuesta.json();

        if (!respuesta.ok) {
          alert(
            datos.mensaje
          );

          return;
        }

        await Promise.all([
          cargarPagos(),
          cargarResumen(),
          cargarCuotasPendientes(),
        ]);

      } catch (error) {
        console.error(error);

        alert(
          "No se pudo rechazar."
        );
      }
    };


  return (
    <>
      <header className="admin-header">

        <div>
          <span>
            Club Catarindo
          </span>

          <h1>
            Gestión de Pagos
          </h1>

          <p>
            Registro y validación de
            pagos correspondientes a
            cuotas de socios.
          </p>
        </div>


        <button
          className="btn-principal"
          onClick={() =>
            setMostrarFormulario(
              !mostrarFormulario
            )
          }
        >
          {mostrarFormulario
            ? "Cancelar"
            : "+ Registrar pago"}
        </button>

      </header>


      <section className="stats-grid">

        <article className="stat-card">

          <span>
            Pagos registrados
          </span>

          <strong>
            {resumen.total}
          </strong>

        </article>


        <article className="stat-card alerta">

          <span>
            Pendientes
          </span>

          <strong>
            {resumen.pendientes}
          </strong>

          <small>
            Por revisar
          </small>

        </article>


        <article className="stat-card ok">

          <span>
            Aprobados
          </span>

          <strong>
            {resumen.aprobados}
          </strong>

          <small>
            Pagos validados
          </small>

        </article>


        <article className="stat-card">

          <span>
            Total cobrado
          </span>

          <strong>
            S/{" "}
            {dinero(
              resumen.totalAprobado
            )}
          </strong>

        </article>

      </section>


      {mostrarFormulario && (
        <section className="panel-box">

          <h2>
            Registrar nuevo pago
          </h2>

          <p>
            Selecciona primero la cuota
            correspondiente al socio.
          </p>


          <form
            className="pago-formulario"
            onSubmit={
              registrarPago
            }
          >

            <div className="campo-formulario">

              <label>
                Cuota *
              </label>

              <select
                value={
                  formulario.cuotaId
                }
                onChange={
                  seleccionarCuota
                }
              >

                <option value="">
                  Seleccionar cuota
                </option>

                {cuotasPendientes.map(
                  (cuota) => (

                    <option
                      key={
                        cuota.id
                      }
                      value={
                        cuota.id
                      }
                    >

                      {cuota.nombre}
                      {" - "}
                      {cuota.zona}
                      -
                      {cuota.lote}
                      {" - "}
                      {
                        MESES[
                          cuota.mes
                        ]
                      }
                      {" "}
                      {cuota.anio}
                      {" - S/ "}
                      {dinero(
                        cuota.monto
                      )}

                    </option>

                  )
                )}

              </select>

            </div>


            <div className="campo-formulario">

              <label>
                Monto *
              </label>

              <input
                type="number"
                step="0.01"
                min="0.01"
                value={
                  formulario.monto
                }
                onChange={(e) =>
                  setFormulario({
                    ...formulario,

                    monto:
                      e.target.value,
                  })
                }
              />

            </div>


            <div className="campo-formulario">

              <label>
                Fecha de pago *
              </label>

              <input
                type="date"
                value={
                  formulario.fechaPago
                }
                onChange={(e) =>
                  setFormulario({
                    ...formulario,

                    fechaPago:
                      e.target.value,
                  })
                }
              />

            </div>


            <div className="campo-formulario">

              <label>
                Método de pago *
              </label>

              <select
                value={
                  formulario.metodoPago
                }
                onChange={(e) =>
                  setFormulario({
                    ...formulario,

                    metodoPago:
                      e.target.value,
                  })
                }
              >

                <option value="">
                  Seleccionar
                </option>

                <option value="Efectivo">
                  Efectivo
                </option>

                <option value="Yape">
                  Yape
                </option>

                <option value="Plin">
                  Plin
                </option>

                <option value="Transferencia bancaria">
                  Transferencia bancaria
                </option>

                <option value="Depósito">
                  Depósito
                </option>

              </select>

            </div>


            <div className="campo-formulario">

              <label>
                N.º de recibo
              </label>

              <input
                type="text"
                value={
                  formulario.numeroRecibo
                }
                onChange={(e) =>
                  setFormulario({
                    ...formulario,

                    numeroRecibo:
                      e.target.value,
                  })
                }
                placeholder="Ej. 2510"
              />

            </div>


            <div className="campo-formulario">

              <label>
                Referencia
              </label>

              <input
                type="text"
                value={
                  formulario.referencia
                }
                onChange={(e) =>
                  setFormulario({
                    ...formulario,

                    referencia:
                      e.target.value,
                  })
                }
                placeholder="Código de operación"
              />

            </div>


            <div className="campo-formulario campo-completo">

              <label>
                Observación
              </label>

              <textarea
                value={
                  formulario.observacion
                }
                onChange={(e) =>
                  setFormulario({
                    ...formulario,

                    observacion:
                      e.target.value,
                  })
                }
                placeholder="Información adicional..."
              />

            </div>


            <div className="campo-completo">

              <button
                className="btn-principal"
                type="submit"
              >
                Registrar pago
              </button>

            </div>

          </form>

        </section>
      )}


      <section className="panel-box">

        <div className="pagos-filtros">

          <input
            type="text"
            value={buscar}
            onChange={(e) =>
              setBuscar(
                e.target.value
              )
            }
            placeholder="Buscar socio, lote o recibo..."
          />


          <select
            value={estado}
            onChange={(e) =>
              setEstado(
                e.target.value
              )
            }
          >

            <option value="">
              Todos los estados
            </option>

            <option value="pendiente">
              Pendientes
            </option>

            <option value="aprobado">
              Aprobados
            </option>

            <option value="rechazado">
              Rechazados
            </option>

          </select>

        </div>


        {cargando ? (

          <div className="estado-vacio">
            <h3>
              Cargando pagos...
            </h3>
          </div>

        ) : pagos.length === 0 ? (

          <div className="estado-vacio">

            <h3>
              No existen pagos
            </h3>

            <p>
              Los pagos registrados
              aparecerán aquí.
            </p>

          </div>

        ) : (

          <div className="tabla-responsive">

            <table className="tabla-admin">

              <thead>

                <tr>
                  <th>
                    Fecha
                  </th>

                  <th>
                    Socio
                  </th>

                  <th>
                    Cuota
                  </th>

                  <th>
                    Método
                  </th>

                  <th>
                    Recibo
                  </th>

                  <th>
                    Monto
                  </th>

                  <th>
                    Estado
                  </th>

                  <th>
                    Acciones
                  </th>
                </tr>

              </thead>


              <tbody>

                {pagos.map(
                  (pago) => (

                    <tr
                      key={
                        pago.id
                      }
                    >

                      <td>
                        {fecha(
                          pago.fecha_pago
                        )}
                      </td>


                      <td>

                        <strong>
                          {pago.nombre}
                        </strong>

                        <small
                          style={{
                            display:
                              "block",
                          }}
                        >
                          {pago.zona}
                          -
                          {pago.lote}
                        </small>

                      </td>


                      <td>

                        {
                          MESES[
                            pago.mes
                          ]
                        }
                        {" "}
                        {pago.anio}

                      </td>


                      <td>
                        {
                          pago.metodo_pago
                        }
                      </td>


                      <td>
                        {
                          pago.numero_recibo ||
                          "-"
                        }
                      </td>


                      <td>

                        <strong>
                          S/{" "}
                          {dinero(
                            pago.monto
                          )}
                        </strong>

                      </td>


                      <td>

                        <span
                          className={`estado-pago ${pago.estado}`}
                        >

                          {pago.estado ===
                          "aprobado"
                            ? "Aprobado"
                            : pago.estado ===
                              "rechazado"
                            ? "Rechazado"
                            : "Pendiente"}

                        </span>

                      </td>


                      <td>

                        {pago.estado ===
                          "pendiente" ? (

                          <div className="acciones-tabla">

                            <button
                              className="btn-tabla exito"
                              onClick={() =>
                                aprobarPago(
                                  pago
                                )
                              }
                            >
                              Aprobar
                            </button>


                            <button
                              className="btn-tabla peligro"
                              onClick={() =>
                                rechazarPago(
                                  pago
                                )
                              }
                            >
                              Rechazar
                            </button>

                          </div>

                        ) : (

                          <span>
                            Revisado
                          </span>

                        )}

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>
        )}

      </section>
    </>
  );
}

export default Pagos;