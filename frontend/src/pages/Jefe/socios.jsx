import { apiFetch } from "../../api.js";
import {
  useEffect,
  useCallback,
  useState,
} from "react";

import SocioDetalle
  from "./sociodetalle.jsx";

function Socios() {
  const [socios, setSocios] =
    useState([]);

  const [resumen, setResumen] =
    useState({
      total: 0,
      activos: 0,
      inactivos: 0,
      zonas: 0,
    });

  const [buscar, setBuscar] =
    useState("");

  const [zona, setZona] =
    useState("");

  const [estado, setEstado] =
    useState("");

  const [cargando, setCargando] =
    useState(true);

  const [error, setError] =
    useState("");

  const [
    socioSeleccionado,
    setSocioSeleccionado,
  ] = useState(null);


  const cargarSocios =
    useCallback(async () => {
      try {
        setCargando(true);
        setError("");

        const parametros =
          new URLSearchParams();

        if (buscar.trim()) {
          parametros.append(
            "buscar",
            buscar.trim()
          );
        }

        if (zona) {
          parametros.append(
            "zona",
            zona
          );
        }

        if (estado) {
          parametros.append(
            "estado",
            estado
          );
        }

        const respuesta =
          await apiFetch(
            `/api/socios?${parametros.toString()}`
          );

        const datos =
          await respuesta.json();

        if (!respuesta.ok) {
          throw new Error(
            datos.mensaje ||
              "No se pudieron cargar los socios."
          );
        }

        setSocios(datos);

      } catch (error) {
        console.error(error);

        setError(
          "No se pudo obtener la información de socios."
        );

      } finally {
        setCargando(false);
      }
    }, [buscar,zona,estado]);


  const cargarResumen =
    async () => {
      try {
        const respuesta =
          await apiFetch(
            "/api/socios/resumen"
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


  useEffect(() => {
    const initial = setTimeout(() => { cargarResumen(); }, 0);
    return () => clearTimeout(initial);
  }, []);


  useEffect(() => {
    const temporizador =
      setTimeout(
        () => {
          cargarSocios();
        },
        350
      );

    return () =>
      clearTimeout(temporizador);

  }, [cargarSocios]);


  const cambiarEstado =
    async (
      socio,
      nuevoEstado
    ) => {
      const mensaje =
        nuevoEstado
          ? `¿Deseas activar a ${socio.nombre}?`
          : `¿Deseas desactivar a ${socio.nombre}?`;

      if (
        !window.confirm(mensaje)
      ) {
        return;
      }

      try {
        const respuesta =
          await apiFetch(
            `/api/socios/${socio.id}/estado`,
            {
              method: "PATCH",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  estado:
                    nuevoEstado,
                }),
            }
          );

        const datos =
          await respuesta.json();

        if (!respuesta.ok) {
          alert(
            datos.mensaje ||
              "No se pudo actualizar."
          );

          return;
        }

        cargarSocios();
        cargarResumen();

      } catch (error) {
        console.error(error);

        alert(
          "Error conectando con el servidor."
        );
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


  if (socioSeleccionado) {
    return (
      <SocioDetalle
        socioId={
          socioSeleccionado
        }
        volver={() =>
          setSocioSeleccionado(
            null
          )
        }
      />
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
            Gestión de Socios
          </h1>

          <p>
            Información de socios,
            propiedades y cuotas
            registradas.
          </p>
        </div>
      </header>


      <section className="stats-grid">

        <article className="stat-card">
          <span>
            Total de socios
          </span>

          <strong>
            {resumen.total || 0}
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
            {resumen.activos || 0}
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
            {resumen.inactivos || 0}
          </strong>

          <small>
            Actualmente inactivos
          </small>
        </article>


        <article className="stat-card">
          <span>
            Zonas
          </span>

          <strong>
            {resumen.zonas || 0}
          </strong>

          <small>
            Registradas
          </small>
        </article>

      </section>


      <section className="panel-box">

        <div className="socios-filtros">

          <input
            type="text"
            placeholder="Buscar por nombre, zona o lote..."
            value={buscar}
            onChange={(e) =>
              setBuscar(
                e.target.value
              )
            }
          />


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

            <option value="activo">
              Activos
            </option>

            <option value="inactivo">
              Inactivos
            </option>
          </select>

        </div>


        {error && (
          <div className="mensaje-error">
            {error}
          </div>
        )}


        {cargando ? (
          <div className="estado-vacio">
            <h3>
              Cargando socios...
            </h3>

            <p>
              Consultando la base
              de datos.
            </p>
          </div>
        ) : socios.length === 0 ? (
          <div className="estado-vacio">

            <h3>
              No se encontraron socios
            </h3>

            <p>
              Cuando importes la lista
              del Excel aparecerán aquí.
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
                    Zona
                  </th>

                  <th>
                    Lote
                  </th>

                  <th>
                    Tipo
                  </th>

                  <th>
                    Cuota
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
                {socios.map(
                  (socio) => (
                    <tr
                      key={
                        socio.id
                      }
                    >
                      <td>
                        <strong>
                          {
                            socio.nombre
                          }
                        </strong>

                        {socio.numero_excel && (
                          <small
                            style={{
                              display:
                                "block",
                              color:
                                "#94a3b8",
                              marginTop:
                                "4px",
                            }}
                          >
                            Registro #
                            {
                              socio.numero_excel
                            }
                          </small>
                        )}
                      </td>


                      <td>
                        {
                          socio.zona ||
                          "-"
                        }
                      </td>


                      <td>
                        {
                          socio.lote ||
                          "-"
                        }
                      </td>


                      <td>
                        {
                          socio.tipo ||
                          "-"
                        }
                      </td>


                      <td>
                        S/{" "}
                        {dinero(
                          socio.cuota_base
                        )}
                      </td>


                      <td>
                        <span
                          className={
                            socio.estado
                              ? "estado ingreso"
                              : "estado egreso"
                          }
                        >
                          {
                            socio.estado
                              ? "Activo"
                              : "Inactivo"
                          }
                        </span>
                      </td>


                      <td>
                        <div className="acciones-tabla">

                          <button
                            className="btn-tabla"
                            onClick={() =>
                              setSocioSeleccionado(
                                socio.id
                              )
                            }
                          >
                            Ver detalle
                          </button>


                          {socio.estado ? (
                            <button
                              className="btn-tabla peligro"
                              onClick={() =>
                                cambiarEstado(
                                  socio,
                                  false
                                )
                              }
                            >
                              Desactivar
                            </button>
                          ) : (
                            <button
                              className="btn-tabla exito"
                              onClick={() =>
                                cambiarEstado(
                                  socio,
                                  true
                                )
                              }
                            >
                              Activar
                            </button>
                          )}

                        </div>
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

export default Socios;