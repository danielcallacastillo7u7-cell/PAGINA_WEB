import {
  useEffect,
  useState,
} from "react";

function SocioDetalle({
  socioId,
  volver,
}) {
  const [datos, setDatos] =
    useState(null);

  const [cargando, setCargando] =
    useState(true);

  const [error, setError] =
    useState("");


  useEffect(() => {
    cargarDetalle();
  }, [socioId]);


  const cargarDetalle =
    async () => {
      try {
        setCargando(true);
        setError("");

        const respuesta =
          await fetch(
            `http://localhost:3000/api/socios/${socioId}`
          );

        const resultado =
          await respuesta.json();

        if (!respuesta.ok) {
          throw new Error(
            resultado.mensaje ||
              "No se pudo obtener el socio."
          );
        }

        setDatos(resultado);

      } catch (error) {
        console.error(error);

        setError(
          "No se pudo obtener el detalle del socio."
        );

      } finally {
        setCargando(false);
      }
    };


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


  if (cargando) {
    return (
      <section className="panel-box">
        <h2>
          Cargando información...
        </h2>
      </section>
    );
  }


  if (error || !datos) {
    return (
      <section className="panel-box">

        <button
          className="btn-tabla"
          onClick={volver}
        >
          Volver
        </button>

        <h2>
          No se pudo cargar
          el socio
        </h2>

        <p>
          {error}
        </p>

      </section>
    );
  }


  const socio =
    datos.socio;


  return (
    <>
      <header className="admin-header">

        <div>
          <span>
            Socios
          </span>

          <h1>
            {socio.nombre}
          </h1>

          <p>
            Información detallada del
            socio y movimientos asociados.
          </p>
        </div>


        <button
          className="btn-tabla"
          onClick={volver}
        >
          ← Volver
        </button>

      </header>


      <section className="panel-box">

        <h2>
          Información del socio
        </h2>


        <div className="detalle-grid">

          <div className="detalle-item">
            <span>
              Nombre
            </span>

            <strong>
              {socio.nombre}
            </strong>
          </div>


          <div className="detalle-item">
            <span>
              Zona
            </span>

            <strong>
              {socio.zona || "-"}
            </strong>
          </div>


          <div className="detalle-item">
            <span>
              Lote / terreno
            </span>

            <strong>
              {socio.lote || "-"}
            </strong>
          </div>


          <div className="detalle-item">
            <span>
              Dirección
            </span>

            <strong>
              {datos.direccion || "-"}
            </strong>
          </div>


          <div className="detalle-item">
            <span>
              Tipo
            </span>

            <strong>
              {socio.tipo || "-"}
            </strong>
          </div>


          <div className="detalle-item">
            <span>
              Cuota base
            </span>

            <strong>
              S/{" "}
              {dinero(
                socio.cuota_base
              )}
            </strong>
          </div>


          <div className="detalle-item">
            <span>
              Estado
            </span>

            <strong>
              {socio.estado
                ? "Activo"
                : "Inactivo"}
            </strong>
          </div>

        </div>

      </section>


      <section className="stats-grid">

        <article className="stat-card">

          <span>
            Total pagado
          </span>

          <strong>
            S/{" "}
            {dinero(
              datos.resumen
                ?.totalIngresos
            )}
          </strong>

          <small>
            Ingresos asociados
          </small>

        </article>


        <article className="stat-card">

          <span>
            Egresos asociados
          </span>

          <strong>
            S/{" "}
            {dinero(
              datos.resumen
                ?.totalEgresos
            )}
          </strong>

        </article>


        <article className="stat-card">

          <span>
            Movimientos
          </span>

          <strong>
            {
              datos.resumen
                ?.movimientos ||
              0
            }
          </strong>

        </article>

      </section>


      <section className="panel-box">

        <h2>
          Historial de movimientos
        </h2>

        <p>
          Movimientos encontrados
          para la propiedad{" "}
          <strong>
            {datos.direccion}
          </strong>.
        </p>


        {datos.movimientos
          ?.length === 0 ? (
          <div className="estado-vacio">

            <h3>
              Sin movimientos
            </h3>

            <p>
              No se encontraron
              registros asociados a
              esta propiedad.
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
                  datos.movimientos.map(
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
        )}

      </section>
    </>
  );
}

export default SocioDetalle;