import {
  useCallback,
  useEffect,
  useState,
} from "react";

function Dashboard() {
  const [datos, setDatos] =
    useState(null);

  const [cargando, setCargando] =
    useState(true);

  const [error, setError] =
    useState("");

  const cargarDashboard =
    useCallback(async () => {
      try {
        setError("");

        const respuesta =
          await fetch(
            "http://localhost:3000/api/dashboard/resumen"
          );

        const resultado =
          await respuesta.json();

        if (!respuesta.ok) {
          throw new Error(
            resultado.mensaje ||
              "No se pudo cargar el dashboard."
          );
        }

        setDatos(resultado);
      } catch (error) {
        console.error(error);

        setError(
          "No se pudo obtener la información del servidor."
        );
      } finally {
        setCargando(false);
      }
    }, []);

  useEffect(() => {
    cargarDashboard();

    /*
      Actualización automática.

      Cada 30 segundos se vuelve
      a consultar la base de datos.
    */

    const intervalo = setInterval(
      cargarDashboard,
      30000
    );

    return () =>
      clearInterval(intervalo);

  }, [cargarDashboard]);

  const dinero = (cantidad) => {
    return Number(
      cantidad || 0
    ).toLocaleString(
      "es-PE",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    );
  };

  const fecha = (valor) => {
    if (!valor) {
      return "-";
    }

    return new Date(
      valor
    ).toLocaleDateString(
      "es-PE"
    );
  };

  if (cargando) {
    return (
      <section className="panel-box">
        <h2>
          Cargando dashboard...
        </h2>

        <p>
          Consultando información
          actual del Club Catarindo.
        </p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="panel-box">

        <h2>
          No se pudo cargar
          la información
        </h2>

        <p>
          {error}
        </p>

        <button
          className="btn-principal"
          onClick={
            cargarDashboard
          }
        >
          Intentar nuevamente
        </button>

      </section>
    );
  }

  return (
    <>
      <header className="admin-header">

        <div>

          <span>
            Club Catarindo
          </span>

          <h1>
            Dashboard
          </h1>

          <p>
            Resumen actualizado de
            socios, ingresos y egresos.
          </p>

        </div>

        <button
          className="btn-principal"
          onClick={
            cargarDashboard
          }
        >
          Actualizar
        </button>

      </header>


      {/* ======================
          SOCIOS
      ====================== */}

      <section className="stats-grid">

        <article className="stat-card">

          <span>
            Total de socios
          </span>

          <strong>
            {datos?.socios?.total || 0}
          </strong>

          <small>
            Registrados
          </small>

        </article>


        <article className="stat-card">

          <span>
            Socios activos
          </span>

          <strong>
            {datos?.socios?.activos || 0}
          </strong>

          <small>
            Actualmente activos
          </small>

        </article>


        <article className="stat-card">

          <span>
            Socios inactivos
          </span>

          <strong>
            {datos?.socios?.inactivos || 0}
          </strong>

          <small>
            Actualmente inactivos
          </small>

        </article>

      </section>


      {/* ======================
          MES ACTUAL
      ====================== */}

      <section className="panel-box">

        <div className="dashboard-section-title">

          <div>

            <h2>
              Movimiento del mes
            </h2>

            <p>
              Ingresos y egresos
              registrados durante
              el mes actual.
            </p>

          </div>

        </div>


        <div className="stats-grid">

          <article className="stat-card">

            <span>
              Ingresos
            </span>

            <strong>
              S/{" "}
              {dinero(
                datos?.mesActual
                  ?.ingresos
              )}
            </strong>

            <small>
              {
                datos?.mesActual
                  ?.cantidadIngresos ||
                0
              } movimientos
            </small>

          </article>


          <article className="stat-card">

            <span>
              Egresos
            </span>

            <strong>
              S/{" "}
              {dinero(
                datos?.mesActual
                  ?.egresos
              )}
            </strong>

            <small>
              {
                datos?.mesActual
                  ?.cantidadEgresos ||
                0
              } movimientos
            </small>

          </article>


          <article className="stat-card">

            <span>
              Saldo del mes
            </span>

            <strong>
              S/{" "}
              {dinero(
                datos?.mesActual
                  ?.saldo
              )}
            </strong>

            <small>
              Ingresos menos egresos
            </small>

          </article>

        </div>

      </section>


      {/* ======================
          HISTÓRICO
      ====================== */}

      <section className="panel-box">

        <h2>
          Resumen histórico
        </h2>

        <p>
          Valores acumulados de todos
          los registros importados.
        </p>


        <div className="stats-grid">

          <article className="stat-card">

            <span>
              Total ingresos
            </span>

            <strong>
              S/{" "}
              {dinero(
                datos?.historico
                  ?.ingresos
              )}
            </strong>

          </article>


          <article className="stat-card">

            <span>
              Total egresos
            </span>

            <strong>
              S/{" "}
              {dinero(
                datos?.historico
                  ?.egresos
              )}
            </strong>

          </article>


          <article className="stat-card">

            <span>
              Saldo acumulado
            </span>

            <strong>
              S/{" "}
              {dinero(
                datos?.historico
                  ?.saldo
              )}
            </strong>

          </article>

        </div>

      </section>


      {/* ======================
          MOVIMIENTOS
      ====================== */}

      <section className="panel-box">

        <h2>
          Últimos movimientos
        </h2>

        <p>
          Últimos ingresos y egresos
          registrados.
        </p>


        {datos?.ultimosMovimientos
          ?.length > 0 ? (

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
                    Tipo
                  </th>

                  <th>
                    Monto
                  </th>

                </tr>

              </thead>


              <tbody>

                {
                  datos
                    .ultimosMovimientos
                    .map(
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
                            {
                              movimiento.direccion ||
                              "-"
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

                            <span
                              className={
                                movimiento.tipo ===
                                "ingreso"
                                  ? "estado ingreso"
                                  : "estado egreso"
                              }
                            >

                              {
                                movimiento.tipo ===
                                "ingreso"
                                  ? "Ingreso"
                                  : "Egreso"
                              }

                            </span>

                          </td>

                          <td>
                            <strong>
                              S/{" "}
                              {dinero(
                                movimiento.monto
                              )}
                            </strong>
                          </td>

                        </tr>

                      )
                    )
                }

              </tbody>

            </table>

          </div>

        ) : (

          <div className="estado-vacio">

            <h3>
              No existen movimientos
            </h3>

            <p>
              Cuando importes el Excel
              aparecerán aquí.
            </p>

          </div>

        )}

      </section>
    </>
  );
}

export default Dashboard;