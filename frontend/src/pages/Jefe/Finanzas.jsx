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


const CATEGORIAS_INGRESO = [
  "Piscina",
  "Terreno",
  "Cuota extraordinaria",
  "Alquiler",
  "Donación",
  "Otros ingresos",
];


const CATEGORIAS_EGRESO = [
  "Mantenimiento",
  "Limpieza",
  "Servicios",
  "Reparaciones",
  "Compras",
  "Administración",
  "Personal",
  "Otros gastos",
];


function Finanzas() {
  const ahora =
    new Date();

  const hoy =
    ahora
      .toISOString()
      .split("T")[0];


  const [anio, setAnio] =
    useState(
      ahora.getFullYear()
    );

  const [mes, setMes] =
    useState(
      ahora.getMonth() + 1
    );

  const [tipoFiltro, setTipoFiltro] =
    useState("");

  const [buscar, setBuscar] =
    useState("");

  const [
    movimientos,
    setMovimientos,
  ] = useState([]);

  const [resumen, setResumen] =
    useState({
      cuotasCobradas: 0,
      otrosIngresos: 0,
      totalIngresos: 0,
      egresos: 0,
      saldo: 0,
    });

  const [cargando, setCargando] =
    useState(true);

  const [
    mostrarFormulario,
    setMostrarFormulario,
  ] = useState(false);


  const [formulario, setFormulario] =
    useState({
      fecha: hoy,
      tipo: "ingreso",
      categoria: "",
      concepto: "",
      monto: "",
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


  const cargarMovimientos =
    useCallback(
      async () => {
        try {
          setCargando(true);

          const parametros =
            new URLSearchParams();

          parametros.append(
            "anio",
            anio
          );

          parametros.append(
            "mes",
            mes
          );

          if (tipoFiltro) {
            parametros.append(
              "tipo",
              tipoFiltro
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
              `http://localhost:3000/api/finanzas?${parametros.toString()}`
            );

          const datos =
            await respuesta.json();


          if (!respuesta.ok) {
            throw new Error(
              datos.mensaje
            );
          }


          setMovimientos(
            datos
          );

        } catch (error) {
          console.error(
            error
          );

        } finally {
          setCargando(false);
        }
      },
      [
        anio,
        mes,
        tipoFiltro,
        buscar,
      ]
    );


  const cargarResumen =
    useCallback(
      async () => {
        try {
          const respuesta =
            await fetch(
              `http://localhost:3000/api/finanzas/resumen?anio=${anio}&mes=${mes}`
            );

          const datos =
            await respuesta.json();

          if (respuesta.ok) {
            setResumen(
              datos
            );
          }

        } catch (error) {
          console.error(
            "Error resumen:",
            error
          );
        }
      },
      [
        anio,
        mes,
      ]
    );


  useEffect(() => {
    const temporizador =
      setTimeout(
        () => {
          cargarMovimientos();
          cargarResumen();
        },
        250
      );

    return () =>
      clearTimeout(
        temporizador
      );

  }, [
    cargarMovimientos,
    cargarResumen,
  ]);


  const categorias =
    formulario.tipo ===
    "ingreso"
      ? CATEGORIAS_INGRESO
      : CATEGORIAS_EGRESO;


  const cambiarTipo =
    (tipo) => {
      setFormulario(
        (anterior) => ({
          ...anterior,

          tipo,

          categoria: "",
        })
      );
    };


  const registrarMovimiento =
    async (e) => {
      e.preventDefault();


      if (
        !formulario.fecha ||
        !formulario.tipo ||
        !formulario.categoria ||
        !formulario.concepto ||
        !formulario.monto
      ) {
        alert(
          "Completa los campos obligatorios."
        );

        return;
      }


      try {
        const respuesta =
          await fetch(
            "http://localhost:3000/api/finanzas",
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
          fecha: hoy,
          tipo: "ingreso",
          categoria: "",
          concepto: "",
          monto: "",
          metodoPago: "",
          numeroRecibo: "",
          referencia: "",
          observacion: "",
        });


        setMostrarFormulario(
          false
        );


        await Promise.all([
          cargarMovimientos(),
          cargarResumen(),
        ]);

      } catch (error) {
        console.error(
          error
        );

        alert(
          "No se pudo conectar con el servidor."
        );
      }
    };


  const eliminarMovimiento =
    async (movimiento) => {
      const confirmar =
        window.confirm(
          `¿Eliminar "${movimiento.concepto}" por S/ ${dinero(movimiento.monto)}?`
        );


      if (!confirmar) {
        return;
      }


      try {
        const respuesta =
          await fetch(
            `http://localhost:3000/api/finanzas/${movimiento.id}`,
            {
              method: "DELETE",
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
          cargarMovimientos(),
          cargarResumen(),
        ]);

      } catch (error) {
        console.error(
          error
        );

        alert(
          "No se pudo eliminar el movimiento."
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
            Ingresos y Egresos
          </h1>

          <p>
            Control financiero de los
            movimientos económicos del club.
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
            : "+ Registrar movimiento"}
        </button>

      </header>


      <section className="stats-grid">

        <article className="stat-card ok">

          <span>
            Cuotas cobradas
          </span>

          <strong>
            S/{" "}
            {dinero(
              resumen.cuotasCobradas
            )}
          </strong>

          <small>
            Pagos aprobados
          </small>

        </article>


        <article className="stat-card ok">

          <span>
            Otros ingresos
          </span>

          <strong>
            S/{" "}
            {dinero(
              resumen.otrosIngresos
            )}
          </strong>

        </article>


        <article className="stat-card alerta">

          <span>
            Egresos
          </span>

          <strong>
            S/{" "}
            {dinero(
              resumen.egresos
            )}
          </strong>

        </article>


        <article className="stat-card">

          <span>
            Saldo del mes
          </span>

          <strong>
            S/{" "}
            {dinero(
              resumen.saldo
            )}
          </strong>

          <small>
            Ingresos - egresos
          </small>

        </article>

      </section>


      {mostrarFormulario && (
        <section className="panel-box">

          <h2>
            Registrar movimiento
          </h2>


          <div className="tipo-movimiento">

            <button
              type="button"
              className={
                formulario.tipo ===
                "ingreso"
                  ? "tipo-btn activo"
                  : "tipo-btn"
              }
              onClick={() =>
                cambiarTipo(
                  "ingreso"
                )
              }
            >
              Ingreso
            </button>


            <button
              type="button"
              className={
                formulario.tipo ===
                "egreso"
                  ? "tipo-btn activo egreso"
                  : "tipo-btn"
              }
              onClick={() =>
                cambiarTipo(
                  "egreso"
                )
              }
            >
              Egreso
            </button>

          </div>


          <form
            className="pago-formulario"
            onSubmit={
              registrarMovimiento
            }
          >

            <div className="campo-formulario">

              <label>
                Fecha *
              </label>

              <input
                type="date"
                value={
                  formulario.fecha
                }
                onChange={(e) =>
                  setFormulario({
                    ...formulario,

                    fecha:
                      e.target.value,
                  })
                }
              />

            </div>


            <div className="campo-formulario">

              <label>
                Categoría *
              </label>

              <select
                value={
                  formulario.categoria
                }
                onChange={(e) =>
                  setFormulario({
                    ...formulario,

                    categoria:
                      e.target.value,
                  })
                }
              >

                <option value="">
                  Seleccionar
                </option>

                {categorias.map(
                  (categoria) => (
                    <option
                      key={
                        categoria
                      }
                      value={
                        categoria
                      }
                    >
                      {categoria}
                    </option>
                  )
                )}

              </select>

            </div>


            <div className="campo-formulario campo-completo">

              <label>
                Concepto *
              </label>

              <input
                type="text"
                value={
                  formulario.concepto
                }
                onChange={(e) =>
                  setFormulario({
                    ...formulario,

                    concepto:
                      e.target.value,
                  })
                }
                placeholder="Ej. Uso de piscina"
              />

            </div>


            <div className="campo-formulario">

              <label>
                Monto *
              </label>

              <input
                type="number"
                min="0.01"
                step="0.01"
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
                placeholder="0.00"
              />

            </div>


            <div className="campo-formulario">

              <label>
                Método
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
                  No especificado
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
                N.º recibo
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
              />

            </div>


            <div className="campo-completo">

              <button
                className="btn-principal"
                type="submit"
              >
                Guardar movimiento
              </button>

            </div>

          </form>

        </section>
      )}


      <section className="panel-box">

        <div className="finanzas-filtros">

          <select
            value={anio}
            onChange={(e) =>
              setAnio(
                Number(
                  e.target.value
                )
              )
            }
          >

            <option value={2025}>
              2025
            </option>

            <option value={2026}>
              2026
            </option>

            <option value={2027}>
              2027
            </option>

          </select>


          <select
            value={mes}
            onChange={(e) =>
              setMes(
                Number(
                  e.target.value
                )
              )
            }
          >

            {MESES.slice(1).map(
              (nombre, index) => (

                <option
                  key={
                    index + 1
                  }
                  value={
                    index + 1
                  }
                >
                  {nombre}
                </option>

              )
            )}

          </select>


          <select
            value={
              tipoFiltro
            }
            onChange={(e) =>
              setTipoFiltro(
                e.target.value
              )
            }
          >

            <option value="">
              Todos
            </option>

            <option value="ingreso">
              Ingresos
            </option>

            <option value="egreso">
              Egresos
            </option>

          </select>


          <input
            type="text"
            placeholder="Buscar concepto o recibo..."
            value={buscar}
            onChange={(e) =>
              setBuscar(
                e.target.value
              )
            }
          />

        </div>


        <h2>
          Movimientos de{" "}
          {MESES[mes]}{" "}
          {anio}
        </h2>


        {cargando ? (

          <div className="estado-vacio">
            <h3>
              Cargando movimientos...
            </h3>
          </div>

        ) : movimientos.length === 0 ? (

          <div className="estado-vacio">

            <h3>
              No existen movimientos
            </h3>

            <p>
              Los ingresos y egresos
              registrados aparecerán aquí.
            </p>

          </div>

        ) : (

          <div className="tabla-responsive">

            <table className="tabla-admin">

              <thead>

                <tr>
                  <th>Fecha</th>
                  <th>Tipo</th>
                  <th>Categoría</th>
                  <th>Concepto</th>
                  <th>Recibo</th>
                  <th>Monto</th>
                  <th>Acción</th>
                </tr>

              </thead>


              <tbody>

                {movimientos.map(
                  (movimiento) => (

                    <tr
                      key={
                        movimiento.id
                      }
                    >

                      <td>
                        {fecha(
                          movimiento.fecha
                        )}
                      </td>


                      <td>

                        <span
                          className={`movimiento-tipo ${movimiento.tipo}`}
                        >
                          {movimiento.tipo ===
                          "ingreso"
                            ? "Ingreso"
                            : "Egreso"}
                        </span>

                      </td>


                      <td>
                        {
                          movimiento.categoria
                        }
                      </td>


                      <td>
                        {
                          movimiento.concepto
                        }
                      </td>


                      <td>
                        {
                          movimiento.numero_recibo ||
                          "-"
                        }
                      </td>


                      <td>

                        <strong>
                          S/{" "}
                          {dinero(
                            movimiento.monto
                          )}
                        </strong>

                      </td>


                      <td>

                        <button
                          className="btn-tabla peligro"
                          onClick={() =>
                            eliminarMovimiento(
                              movimiento
                            )
                          }
                        >
                          Eliminar
                        </button>

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

export default Finanzas;