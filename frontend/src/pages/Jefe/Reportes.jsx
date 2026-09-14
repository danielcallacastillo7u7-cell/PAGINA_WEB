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


function Reportes() {
  const ahora =
    new Date();

  const [anio, setAnio] =
    useState(
      ahora.getFullYear()
    );

  const [mes, setMes] =
    useState(
      ahora.getMonth() + 1
    );

  const [resumen, setResumen] =
    useState(null);

  const [
    movimientos,
    setMovimientos,
  ] = useState([]);

  const [cargando, setCargando] =
    useState(true);

  const [
    descargando,
    setDescargando,
  ] = useState(false);

  const [error, setError] =
    useState("");


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
      if (!valor) {
        return "-";
      }

      return new Date(
        valor
      ).toLocaleDateString(
        "es-PE"
      );
    };


  const cargarReporte =
    useCallback(
      async () => {
        try {
          setCargando(true);

          setError("");


          const [
            respuestaResumen,
            respuestaMovimientos,
          ] =
            await Promise.all([
              fetch(
                `http://localhost:3000/api/reportes/resumen?anio=${anio}&mes=${mes}`
              ),

              fetch(
                `http://localhost:3000/api/reportes/movimientos?anio=${anio}&mes=${mes}`
              ),
            ]);


          const datosResumen =
            await respuestaResumen.json();

          const datosMovimientos =
            await respuestaMovimientos.json();


          if (
            !respuestaResumen.ok
          ) {
            throw new Error(
              datosResumen.mensaje
            );
          }


          if (
            !respuestaMovimientos.ok
          ) {
            throw new Error(
              datosMovimientos.mensaje
            );
          }


          setResumen(
            datosResumen
          );

          setMovimientos(
            datosMovimientos
          );

        } catch (error) {
          console.error(
            error
          );

          setError(
            "No se pudo cargar el reporte."
          );

        } finally {
          setCargando(false);
        }
      },
      [
        anio,
        mes,
      ]
    );


  useEffect(() => {
    cargarReporte();
  }, [
    cargarReporte,
  ]);


  const descargarExcel =
    async () => {
      try {
        setDescargando(true);


        const respuesta =
          await fetch(
            `http://localhost:3000/api/reportes/excel/${anio}`
          );


        if (!respuesta.ok) {
          const datos =
            await respuesta.json();

          alert(
            datos.mensaje ||
            "No se pudo generar el Excel."
          );

          return;
        }


        const archivo =
          await respuesta.blob();


        const url =
          window.URL.createObjectURL(
            archivo
          );


        const enlace =
          document.createElement(
            "a"
          );


        enlace.href =
          url;


        enlace.download =
          `CLUB_CATARINDO_${anio}.xlsx`;


        document.body.appendChild(
          enlace
        );


        enlace.click();


        enlace.remove();


        window.URL.revokeObjectURL(
          url
        );

      } catch (error) {
        console.error(
          error
        );

        alert(
          "No se pudo descargar el Excel."
        );

      } finally {
        setDescargando(false);
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
            Reportes
          </h1>

          <p>
            Resumen de cuotas,
            ingresos, egresos y
            movimientos financieros.
          </p>
        </div>


        <button
          className="btn-principal"
          onClick={
            descargarExcel
          }
          disabled={
            descargando
          }
        >
          {descargando
            ? "Generando Excel..."
            : "Descargar Excel"}
        </button>

      </header>


      <section className="panel-box">

        <div className="reporte-filtros">

          <div>
            <label>
              Año
            </label>

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
              <option value="2025">
                2025
              </option>

              <option value="2026">
                2026
              </option>

              <option value="2027">
                2027
              </option>
            </select>
          </div>


          <div>
            <label>
              Mes
            </label>

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
              {MESES
                .slice(1)
                .map(
                  (
                    nombre,
                    index
                  ) => (
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
          </div>

        </div>

      </section>


      {error && (
        <div className="mensaje-error">
          {error}
        </div>
      )}


      {cargando ? (

        <section className="panel-box">

          <div className="estado-vacio">

            <h3>
              Generando reporte...
            </h3>

          </div>

        </section>

      ) : resumen ? (

        <>

          <section className="stats-grid">

            <article className="stat-card">

              <span>
                Cuotas generadas
              </span>

              <strong>
                S/{" "}
                {dinero(
                  resumen.montoGenerado
                )}
              </strong>

              <small>
                {resumen.totalCuotas}
                {" "}cuotas
              </small>

            </article>


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
                {
                  resumen.cuotasPagadas
                }
                {" "}pagadas
              </small>

            </article>


            <article className="stat-card alerta">

              <span>
                Por cobrar
              </span>

              <strong>
                S/{" "}
                {dinero(
                  resumen.montoPorCobrar
                )}
              </strong>

              <small>
                {
                  resumen.cuotasPendientes
                }
                {" "}pendientes
              </small>

            </article>


            <article className="stat-card">

              <span>
                Cuotas vencidas
              </span>

              <strong>
                {
                  resumen.cuotasVencidas
                }
              </strong>

              <small>
                Socios con deuda
              </small>

            </article>

          </section>


          <section className="panel-box">

            <h2>
              Resumen financiero
            </h2>

            <p>
              {MESES[mes]}{" "}
              {anio}
            </p>


            <div className="resumen-financiero">

              <div>
                <span>
                  Cuotas cobradas
                </span>

                <strong>
                  S/{" "}
                  {dinero(
                    resumen.cuotasCobradas
                  )}
                </strong>
              </div>


              <div>
                <span>
                  Otros ingresos
                </span>

                <strong>
                  S/{" "}
                  {dinero(
                    resumen.otrosIngresos
                  )}
                </strong>
              </div>


              <div className="total">

                <span>
                  Total ingresos
                </span>

                <strong>
                  S/{" "}
                  {dinero(
                    resumen.totalIngresos
                  )}
                </strong>

              </div>


              <div className="egreso">

                <span>
                  Total egresos
                </span>

                <strong>
                  S/{" "}
                  {dinero(
                    resumen.egresos
                  )}
                </strong>

              </div>


              <div className="saldo">

                <span>
                  Saldo del mes
                </span>

                <strong>
                  S/{" "}
                  {dinero(
                    resumen.saldo
                  )}
                </strong>

              </div>

            </div>

          </section>


          <section className="panel-box">

            <div className="panel-titulo-fila">

              <div>
                <h2>
                  Movimientos
                </h2>

                <p>
                  Detalle de ingresos
                  y egresos registrados
                  durante el mes.
                </p>
              </div>

            </div>


            {movimientos.length ===
            0 ? (

              <div className="estado-vacio">

                <h3>
                  Sin movimientos
                </h3>

                <p>
                  Aún no existen
                  movimientos para este
                  período.
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
                        Dirección
                      </th>

                      <th>
                        Concepto
                      </th>

                      <th>
                        Recibo
                      </th>

                      <th>
                        Ingreso
                      </th>

                      <th>
                        Egreso
                      </th>
                    </tr>

                  </thead>


                  <tbody>

                    {movimientos.map(
                      (
                        movimiento
                      ) => (

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
                            {
                              movimiento.direccion ||
                              "-"
                            }
                          </td>


                          <td>

                            <strong>
                              {
                                movimiento.concepto
                              }
                            </strong>

                            <small
                              style={{
                                display:
                                  "block",
                              }}
                            >
                              {
                                movimiento.categoria
                              }
                            </small>

                          </td>


                          <td>
                            {
                              movimiento.numeroRecibo ||
                              "-"
                            }
                          </td>


                          <td>

                            {movimiento.ingreso >
                            0
                              ? `S/ ${dinero(
                                  movimiento.ingreso
                                )}`
                              : "-"}

                          </td>


                          <td>

                            {movimiento.egreso >
                            0
                              ? `S/ ${dinero(
                                  movimiento.egreso
                                )}`
                              : "-"}

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

      ) : null}
    </>
  );
}


export default Reportes;