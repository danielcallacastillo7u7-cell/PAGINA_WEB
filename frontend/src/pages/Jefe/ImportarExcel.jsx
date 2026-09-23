import { apiFetch } from "../../api.js";
import { useState } from "react";

function ImportarExcel() {
  const [archivo, setArchivo] = useState(null);
  const [resultado, setResultado] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [importando, setImportando] = useState(false);

  const analizarArchivo = async () => {
    if (!archivo) {
      alert("Selecciona un archivo Excel.");
      return;
    }

    const formData = new FormData();

    formData.append("archivo", archivo);

    try {
      setCargando(true);

      const respuesta = await apiFetch(
        "/api/importaciones/analizar",
        {
          method: "POST",
          body: formData,
        }
      );

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        alert(
          datos.mensaje ||
            "No se pudo analizar el archivo."
        );

        return;
      }

      setResultado(datos);
    } catch (error) {
      console.error(
        "Error analizando Excel:",
        error
      );

      alert(
        "No se pudo conectar con el servidor."
      );
    } finally {
      setCargando(false);
    }
  };

  const confirmarImportacion = async () => {
    if (!archivo) {
      alert("Selecciona un archivo Excel.");
      return;
    }

    const confirmar = window.confirm(
      "¿Deseas importar definitivamente esta información a la base de datos?"
    );

    if (!confirmar) {
      return;
    }

    const formData = new FormData();

    formData.append("archivo", archivo);

    try {
      setImportando(true);

      const respuesta = await apiFetch(
        "/api/importaciones/confirmar",
        {
          method: "POST",
          body: formData,
        }
      );

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        alert(
          datos.mensaje ||
            "No se pudo completar la importación."
        );

        return;
      }

      alert(
        `Importación completada correctamente.

Socios importados: ${datos.socios}
Movimientos importados: ${datos.movimientos}`
      );
    } catch (error) {
      console.error(
        "Error importando Excel:",
        error
      );

      alert(
        "Ocurrió un error durante la importación."
      );
    } finally {
      setImportando(false);
    }
  };

  const cambiarArchivo = (e) => {
    const archivoSeleccionado =
      e.target.files[0];

    setArchivo(
      archivoSeleccionado || null
    );

    setResultado(null);
  };

  const limpiarArchivo = () => {
    setArchivo(null);
    setResultado(null);
  };

  return (
    <>
      <header className="admin-header">
        <div>
          <span>
            Panel del Jefe
          </span>

          <h1>
            Importar datos desde Excel
          </h1>

          <p>
            Analiza e importa la lista de socios,
            ingresos y egresos administrativos
            del Club Catarindo.
          </p>
        </div>
      </header>

      <section className="panel-box">
        <h2>
          Seleccionar archivo
        </h2>

        <p>
          Puedes seleccionar un archivo en
          formato .xlsx o .xls.
        </p>

        <div className="excel-upload-area">
          <div className="excel-upload-icon">
            📄
          </div>

          <h3>
            Importar archivo de Excel
          </h3>

          <p>
            Selecciona el archivo administrativo
            del Club Catarindo.
          </p>

          <label className="excel-file-button">
            Seleccionar archivo

            <input
              type="file"
              accept=".xlsx,.xls"
              hidden
              onChange={cambiarArchivo}
            />
          </label>

          {archivo && (
            <div className="excel-selected-file">
              <span>
                Archivo seleccionado
              </span>

              <strong>
                {archivo.name}
              </strong>

              <button
                type="button"
                onClick={limpiarArchivo}
                style={{
                  marginTop: "10px",
                  background: "transparent",
                  border: "none",
                  color: "#dc2626",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                Quitar archivo
              </button>
            </div>
          )}
        </div>

        <div
          style={{
            marginTop: "20px",
          }}
        >
          <button
            className="btn-principal"
            onClick={analizarArchivo}
            disabled={!archivo || cargando}
          >
            {cargando
              ? "Analizando archivo..."
              : "Analizar Excel"}
          </button>
        </div>
      </section>

      {cargando && (
        <section className="panel-box">
          <h2>
            Analizando información...
          </h2>

          <p>
            Estamos revisando los socios,
            ingresos y egresos encontrados
            en el archivo.
          </p>
        </section>
      )}

      {resultado && (
        <>
          <section className="panel-box">
            <h2>
              Archivo analizado
            </h2>

            <p>
              <strong>
                {resultado.archivo}
              </strong>
            </p>

            <p>
              Revisa el resumen antes
              de realizar la importación
              definitiva.
            </p>
          </section>

          <section className="stats-grid">
            <article className="stat-card">
              <span>
                Socios
              </span>

              <strong>
                {resultado.resumen?.socios || 0}
              </strong>

              <small>
                Registros encontrados
              </small>
            </article>

            <article className="stat-card ok">
              <span>
                Ingresos
              </span>

              <strong>
                {resultado.resumen?.ingresos || 0}
              </strong>

              <small>
                S/{" "}
                {Number(
                  resultado.resumen
                    ?.montoIngresos || 0
                ).toFixed(2)}
              </small>
            </article>

            <article className="stat-card alerta">
              <span>
                Egresos
              </span>

              <strong>
                {resultado.resumen?.egresos || 0}
              </strong>

              <small>
                S/{" "}
                {Number(
                  resultado.resumen
                    ?.montoEgresos || 0
                ).toFixed(2)}
              </small>
            </article>

            <article className="stat-card">
              <span>
                Movimientos
              </span>

              <strong>
                {resultado.resumen
                  ?.movimientos || 0}
              </strong>

              <small>
                Registros financieros
              </small>
            </article>
          </section>

          <section className="panel-box">
            <h2>
              Resumen financiero
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "15px",
                marginTop: "15px",
              }}
            >
              <div className="stat-card">
                <span>
                  Total ingresos
                </span>

                <strong>
                  S/{" "}
                  {Number(
                    resultado.resumen
                      ?.montoIngresos || 0
                  ).toFixed(2)}
                </strong>
              </div>

              <div className="stat-card">
                <span>
                  Total egresos
                </span>

                <strong>
                  S/{" "}
                  {Number(
                    resultado.resumen
                      ?.montoEgresos || 0
                  ).toFixed(2)}
                </strong>
              </div>

              <div className="stat-card">
                <span>
                  Saldo calculado
                </span>

                <strong>
                  S/{" "}
                  {(
                    Number(
                      resultado.resumen
                        ?.montoIngresos || 0
                    ) -
                    Number(
                      resultado.resumen
                        ?.montoEgresos || 0
                    )
                  ).toFixed(2)}
                </strong>
              </div>
            </div>
          </section>

          <section className="panel-box">
            <h2>
              Vista previa de socios
            </h2>

            <p>
              Se muestran solamente algunos
              registros para revisión.
            </p>

            {resultado.socios?.length > 0 ? (
              <div className="socios-lista">
                {resultado.socios.map(
                  (socio, index) => (
                    <article
                      className="socio-card"
                      key={
                        `${socio.nombre}-${socio.lote}-${index}`
                      }
                    >
                      <div>
                        <h3>
                          {socio.nombre}
                        </h3>

                        <p>
                          Zona{" "}
                          {socio.zona || "-"}
                          {" · "}
                          Lote{" "}
                          {socio.lote || "-"}
                        </p>

                        <span>
                          {socio.tipo ||
                            "Sin tipo registrado"}
                        </span>
                      </div>

                      <div>
                        <strong>
                          S/{" "}
                          {Number(
                            socio.cuotaBase || 0
                          ).toFixed(2)}
                        </strong>

                        <small
                          style={{
                            display: "block",
                            marginTop: "4px",
                            color: "#64748b",
                          }}
                        >
                          Cuota base
                        </small>
                      </div>
                    </article>
                  )
                )}
              </div>
            ) : (
              <p>
                No se encontraron socios
                en el archivo.
              </p>
            )}
          </section>

          <section className="panel-box">
            <h2>
              Vista previa de movimientos
            </h2>

            <p>
              Ingresos y egresos detectados
              en las hojas del Excel.
            </p>

            {resultado.movimientos?.length > 0 ? (
              <div className="socios-lista">
                {resultado.movimientos.map(
                  (movimiento, index) => (
                    <article
                      className="socio-card"
                      key={
                        `${movimiento.fecha}-${movimiento.numeroRecibo}-${index}`
                      }
                    >
                      <div>
                        <h3>
                          {movimiento.concepto}
                        </h3>

                        <p>
                          {movimiento.fecha ||
                            "Sin fecha"}

                          {" · "}

                          {movimiento.direccion ||
                            "Sin dirección"}
                        </p>

                        <span>
                          {movimiento.tipo ===
                          "ingreso"
                            ? "Ingreso"
                            : "Egreso"}

                          {" · Recibo: "}

                          {movimiento.numeroRecibo ||
                            "-"}
                        </span>

                        {movimiento.hojaExcel && (
                          <span
                            style={{
                              display: "block",
                              marginTop: "4px",
                            }}
                          >
                            Hoja:{" "}
                            {
                              movimiento.hojaExcel
                            }
                          </span>
                        )}
                      </div>

                      <div>
                        <strong>
                          S/{" "}
                          {Number(
                            movimiento.monto || 0
                          ).toFixed(2)}
                        </strong>
                      </div>
                    </article>
                  )
                )}
              </div>
            ) : (
              <p>
                No se encontraron movimientos
                financieros.
              </p>
            )}
          </section>

          <section className="panel-box">
            <h2>
              Confirmar importación
            </h2>

            <p>
              Después de revisar la información,
              podrás guardarla en la base de
              datos del Club Catarindo.
            </p>

            <div
              style={{
                marginTop: "20px",
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
              }}
            >
              <button
                className="btn-principal"
                onClick={
                  confirmarImportacion
                }
                disabled={importando}
              >
                {importando
                  ? "Importando..."
                  : "Confirmar importación"}
              </button>

              <button
                type="button"
                onClick={limpiarArchivo}
                disabled={importando}
                style={{
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  padding: "10px 18px",
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
              >
                Cancelar
              </button>
            </div>
          </section>
        </>
      )}
    </>
  );
}

export default ImportarExcel;