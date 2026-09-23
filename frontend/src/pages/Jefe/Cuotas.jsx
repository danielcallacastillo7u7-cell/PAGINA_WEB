import { apiFetch } from "../../api.js";
import {
  useCallback,
  useEffect,
  useState,
} from "react";

const MESES = [
  {
    numero: 1,
    nombre: "Enero",
  },
  {
    numero: 2,
    nombre: "Febrero",
  },
  {
    numero: 3,
    nombre: "Marzo",
  },
  {
    numero: 4,
    nombre: "Abril",
  },
  {
    numero: 5,
    nombre: "Mayo",
  },
  {
    numero: 6,
    nombre: "Junio",
  },
  {
    numero: 7,
    nombre: "Julio",
  },
  {
    numero: 8,
    nombre: "Agosto",
  },
  {
    numero: 9,
    nombre: "Septiembre",
  },
  {
    numero: 10,
    nombre: "Octubre",
  },
  {
    numero: 11,
    nombre: "Noviembre",
  },
  {
    numero: 12,
    nombre: "Diciembre",
  },
];

function Cuotas() {
  const fechaActual =
    new Date();

  const [anio, setAnio] =
    useState(
      fechaActual.getFullYear()
    );

  const [mes, setMes] =
    useState(
      fechaActual.getMonth() + 1
    );

  const [estado, setEstado] =
    useState("");

  const [zona, setZona] =
    useState("");

  const [buscar, setBuscar] =
    useState("");

  const [cuotas, setCuotas] =
    useState([]);

  const [resumen, setResumen] =
    useState({
      total: 0,
      pagadas: 0,
      pendientes: 0,
      vencidas: 0,
      totalGenerado: 0,
      totalPagado: 0,
      totalPorCobrar: 0,
    });

  const [cargando, setCargando] =
    useState(true);

  const [generando, setGenerando] =
    useState(false);

  const [error, setError] =
    useState("");


  const dinero = (valor) =>
    Number(
      valor || 0
    ).toLocaleString(
      "es-PE",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    );


  const formatearFecha =
    (valor) => {
      if (!valor) return "-";

      return new Date(
        valor
      ).toLocaleDateString(
        "es-PE"
      );
    };


  const cargarResumen =
    useCallback(
      async () => {
        try {
          const respuesta =
            await apiFetch(
              `/api/cuotas/resumen/${anio}`
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
      },
      [anio]
    );


  const actualizarVencidas =
    async () => {
      try {
        await apiFetch(
          "/api/cuotas/actualizar-vencidas",
          {
            method: "PATCH",
          }
        );

      } catch (error) {
        console.error(
          "Error actualizando vencidas:",
          error
        );
      }
    };


  const cargarCuotas =
    useCallback(
      async () => {
        try {
          setCargando(true);
          setError("");

          const parametros =
            new URLSearchParams();

          parametros.append(
            "anio",
            anio
          );

          if (mes) {
            parametros.append(
              "mes",
              mes
            );
          }

          if (estado) {
            parametros.append(
              "estado",
              estado
            );
          }

          if (zona) {
            parametros.append(
              "zona",
              zona
            );
          }

          if (buscar.trim()) {
            parametros.append(
              "buscar",
              buscar.trim()
            );
          }

          const respuesta =
            await apiFetch(
              `/api/cuotas?${parametros.toString()}`
            );

          const datos =
            await respuesta.json();

          if (!respuesta.ok) {
            throw new Error(
              datos.mensaje ||
                "No se pudieron cargar las cuotas."
            );
          }

          setCuotas(datos);

        } catch (error) {
          console.error(error);

          setError(
            "No se pudo obtener la información de cuotas."
          );

        } finally {
          setCargando(false);
        }
      },
      [
        anio,
        mes,
        estado,
        zona,
        buscar,
      ]
    );


  useEffect(() => {
    const iniciar =
      async () => {
        await actualizarVencidas();

        await Promise.all([
          cargarCuotas(),
          cargarResumen(),
        ]);
      };

    iniciar();

  }, [
    cargarCuotas,
    cargarResumen,
  ]);


  const generarCuotas =
    async () => {
      const nombreMes =
        MESES.find(
          (item) =>
            item.numero ===
            Number(mes)
        )?.nombre;

      const confirmar =
        window.confirm(
          `¿Deseas generar las cuotas de ${nombreMes} ${anio} para todos los socios activos?`
        );

      if (!confirmar) return;


      const ultimoDia =
        new Date(
          anio,
          mes,
          0
        ).getDate();


      const fechaVencimiento =
        `${anio}-${String(
          mes
        ).padStart(
          2,
          "0"
        )}-${String(
          ultimoDia
        ).padStart(
          2,
          "0"
        )}`;


      try {
        setGenerando(true);

        const respuesta =
          await apiFetch(
            "/api/cuotas/generar",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  anio:
                    Number(anio),

                  mes:
                    Number(mes),

                  fechaVencimiento,
                }),
            }
          );

        const datos =
          await respuesta.json();

        if (!respuesta.ok) {
          alert(
            datos.mensaje ||
              "No se pudieron generar las cuotas."
          );

          return;
        }

        alert(
          `Cuotas generadas correctamente.\n\nNuevas cuotas: ${datos.generadas}`
        );

        await cargarCuotas();

        await cargarResumen();

      } catch (error) {
        console.error(
          error
        );

        alert(
          "No se pudo conectar con el servidor."
        );

      } finally {
        setGenerando(false);
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
            Gestión de Cuotas
          </h1>

          <p>
            Genera y controla las
            cuotas mensuales de los
            socios del club.
          </p>
        </div>


        <button
          className="btn-principal"
          onClick={
            generarCuotas
          }
          disabled={
            generando
          }
        >
          {generando
            ? "Generando..."
            : "Generar cuotas del mes"}
        </button>

      </header>


      <section className="stats-grid">

        <article className="stat-card">

          <span>
            Total generado
          </span>

          <strong>
            S/{" "}
            {dinero(
              resumen.totalGenerado
            )}
          </strong>

          <small>
            Año {anio}
          </small>

        </article>


        <article className="stat-card ok">

          <span>
            Cobrado
          </span>

          <strong>
            S/{" "}
            {dinero(
              resumen.totalPagado
            )}
          </strong>

          <small>
            {
              resumen.pagadas
            } cuotas pagadas
          </small>

        </article>


        <article className="stat-card alerta">

          <span>
            Por cobrar
          </span>

          <strong>
            S/{" "}
            {dinero(
              resumen.totalPorCobrar
            )}
          </strong>

          <small>
            {
              resumen.pendientes
            } pendientes
          </small>

        </article>


        <article className="stat-card">

          <span>
            Vencidas
          </span>

          <strong>
            {
              resumen.vencidas
            }
          </strong>

          <small>
            Cuotas vencidas
          </small>

        </article>

      </section>


      <section className="panel-box">

        <h2>
          Consultar cuotas
        </h2>


        <div className="cuotas-filtros">

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

            {MESES.map(
              (item) => (
                <option
                  key={
                    item.numero
                  }
                  value={
                    item.numero
                  }
                >
                  {item.nombre}
                </option>
              )
            )}

          </select>


          <select
            value={zona}
            onChange={(e) =>
              setZona(
                e.target.value
              )
            }
          >

            <option value="">
              Todas las zonas
            </option>

            <option value="A">
              Zona A
            </option>

            <option value="B">
              Zona B
            </option>

            <option value="C">
              Zona C
            </option>

            <option value="D">
              Zona D
            </option>

          </select>


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
              Pendiente
            </option>

            <option value="pagado">
              Pagado
            </option>

            <option value="vencido">
              Vencido
            </option>

          </select>


          <input
            type="text"
            placeholder="Buscar socio..."
            value={buscar}
            onChange={(e) =>
              setBuscar(
                e.target.value
              )
            }
          />

        </div>

      </section>


      <section className="panel-box">

        <div className="panel-titulo-fila">

          <div>
            <h2>
              Cuotas registradas
            </h2>

            <p>
              Se muestran las cuotas
              correspondientes al período
              seleccionado.
            </p>
          </div>

        </div>


        {error && (
          <div className="mensaje-error">
            {error}
          </div>
        )}


        {cargando ? (

          <div className="estado-vacio">

            <h3>
              Cargando cuotas...
            </h3>

          </div>

        ) : cuotas.length === 0 ? (

          <div className="estado-vacio">

            <h3>
              No existen cuotas
            </h3>

            <p>
              Puedes generarlas usando
              el botón "Generar cuotas
              del mes".
            </p>

          </div>

        ) : (

          <div className="tabla-responsive">

            <table className="tabla-admin">

              <thead>

                <tr>

                  <th>
                    Socio
                  </th>

                  <th>
                    Propiedad
                  </th>

                  <th>
                    Período
                  </th>

                  <th>
                    Vencimiento
                  </th>

                  <th>
                    Monto
                  </th>

                  <th>
                    Estado
                  </th>

                </tr>

              </thead>


              <tbody>

                {cuotas.map(
                  (cuota) => (

                    <tr
                      key={
                        cuota.id
                      }
                    >

                      <td>

                        <strong>
                          {
                            cuota.nombre
                          }
                        </strong>

                      </td>


                      <td>

                        {
                          cuota.zona ||
                          "-"
                        }
                        -
                        {
                          cuota.lote ||
                          "-"
                        }

                      </td>


                      <td>

                        {
                          cuota.nombreMes
                        }{" "}
                        {
                          cuota.anio
                        }

                      </td>


                      <td>

                        {formatearFecha(
                          cuota.fecha_vencimiento
                        )}

                      </td>


                      <td>

                        <strong>

                          S/{" "}
                          {dinero(
                            cuota.monto
                          )}

                        </strong>

                      </td>


                      <td>

                        <span
                          className={`estado-cuota ${cuota.estado}`}
                        >

                          {
                            cuota.estado ===
                            "pagado"
                              ? "Pagado"
                              : cuota.estado ===
                                "vencido"
                              ? "Vencido"
                              : "Pendiente"
                          }

                        </span>

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

export default Cuotas;