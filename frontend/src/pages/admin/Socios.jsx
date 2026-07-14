import { useEffect, useState } from "react";

function Socios() {
  const [busqueda, setBusqueda] = useState("");
  const [socios, setSocios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [verPassword, setVerPassword] = useState(false);
  const [verConfirmarPassword, setVerConfirmarPassword] = useState(false);
  const [socioEditando, setSocioEditando] = useState(null);
  const [historialSocio, setHistorialSocio] = useState(null);

  const [nuevoSocio, setNuevoSocio] = useState({
    nombre: "",
    correo: "",
    password: "",
    confirmarPassword: "",
  });

  async function cargarSocios() {
    try {
      const respuesta = await fetch("http://localhost:3000/api/admin/socios");
      const datos = await respuesta.json();
      setSocios(datos);
    } catch (error) {
      console.error("Error cargando socios:", error);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarSocios();
  }, []);

  function cambiarDato(e) {
    setNuevoSocio({
      ...nuevoSocio,
      [e.target.name]: e.target.value,
    });
  }

  function passwordValida(password) {
    const tieneMayuscula = /[A-Z]/.test(password);
    const tieneMinuscula = /[a-z]/.test(password);
    const tieneNumero = /[0-9]/.test(password);
    const tieneSimbolo = /[^A-Za-z0-9]/.test(password);

    return (
      password.length >= 8 &&
      tieneMayuscula &&
      tieneMinuscula &&
      tieneNumero &&
      tieneSimbolo
    );
  }

  async function registrarSocio(e) {
    e.preventDefault();

    if (!passwordValida(nuevoSocio.password)) {
      alert(
        "La contraseña debe tener mínimo 8 caracteres, una mayúscula, una minúscula, un número y un símbolo."
      );
      return;
    }

    if (nuevoSocio.password !== nuevoSocio.confirmarPassword) {
      alert("Las contraseñas no coinciden.");
      return;
    }

    const respuesta = await fetch("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        nombre: nuevoSocio.nombre,
        correo: nuevoSocio.correo,
        password: nuevoSocio.password,
        rol: "usuario",
      }),
    });

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      alert(resultado.mensaje || "No se pudo registrar el socio.");
      return;
    }

    alert("Socio registrado correctamente.");

    setNuevoSocio({
      nombre: "",
      correo: "",
      password: "",
      confirmarPassword: "",
    });

    setMostrarFormulario(false);
    cargarSocios();
  }

  function verHistorial(socio) {
    setHistorialSocio(socio);
  }

  function editarSocio(socio) {
    setSocioEditando({
      id: socio.id,
      nombre: socio.nombre,
      correo: socio.correo,
    });
  }

  function cambiarEdicion(e) {
    setSocioEditando({
      ...socioEditando,
      [e.target.name]: e.target.value,
    });
  }

  async function guardarEdicion(e) {
    e.preventDefault();

    const respuesta = await fetch(
      `http://localhost:3000/api/admin/socios/${socioEditando.id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre: socioEditando.nombre,
          correo: socioEditando.correo,
        }),
      }
    );

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      alert(resultado.mensaje || "No se pudo editar el socio");
      return;
    }

    alert("Socio actualizado correctamente");
    setSocioEditando(null);
    cargarSocios();
  }

  async function desactivarSocio(id) {
    const confirmar = confirm("¿Seguro que deseas desactivar este socio?");

    if (!confirmar) return;

    const respuesta = await fetch(
      `http://localhost:3000/api/admin/socios/${id}/desactivar`,
      {
        method: "PATCH",
      }
    );

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      alert(resultado.mensaje || "No se pudo desactivar el socio");
      return;
    }

    alert("Socio desactivado correctamente");
    cargarSocios();
  }

  async function activarSocio(id) {
    const confirmar = confirm("¿Seguro que deseas activar este socio?");

    if (!confirmar) return;

    const respuesta = await fetch(
      `http://localhost:3000/api/admin/socios/${id}/activar`,
      {
        method: "PATCH",
      }
    );

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      alert(resultado.mensaje || "No se pudo activar el socio");
      return;
    }

    alert("Socio activado correctamente");
    cargarSocios();
  }

  const sociosFiltrados = socios.filter((socio) => {
    const texto = busqueda.toLowerCase();

    return (
      socio.nombre.toLowerCase().includes(texto) ||
      socio.correo.toLowerCase().includes(texto) ||
      String(socio.id).includes(texto)
    );
  });

  const totalSocios = socios.length;
  const sociosActivos = socios.filter((socio) => socio.estado).length;
  const sociosInactivos = socios.filter((socio) => !socio.estado).length;

  return (
    <>
      <header className="admin-header">
        <div>
          <span>Panel del Administrador</span>
          <h1>Gestión de Socios</h1>
          <p>
            Registra socios, consulta usuarios guardados y busca por nombre,
            correo o código.
          </p>
        </div>

        <button onClick={() => setMostrarFormulario(!mostrarFormulario)}>
          {mostrarFormulario ? "Cerrar formulario" : "Registrar socio"}
        </button>
      </header>

      <section className="stats-grid">
        <article className="stat-card">
          <span>Total de socios</span>
          <strong>{totalSocios}</strong>
          <small>Registrados en el sistema</small>
        </article>

        <article className="stat-card ok">
          <span>Socios activos</span>
          <strong>{sociosActivos}</strong>
          <small>Con acceso habilitado</small>
        </article>

        <article className="stat-card alerta">
          <span>Socios inactivos</span>
          <strong>{sociosInactivos}</strong>
          <small>Requieren revisión</small>
        </article>

        <article className="stat-card">
          <span>Resultados</span>
          <strong>{sociosFiltrados.length}</strong>
          <small>Coinciden con la búsqueda</small>
        </article>
      </section>

      {mostrarFormulario && (
        <section className="panel-box formulario-socio">
          <h2>Registrar nuevo socio</h2>

          <form onSubmit={registrarSocio}>
            <label>
              Nombre completo
              <input
                type="text"
                name="nombre"
                placeholder="Ejemplo: Juan Pérez"
                value={nuevoSocio.nombre}
                onChange={cambiarDato}
                required
              />
            </label>

            <label>
              Correo electrónico
              <input
                type="email"
                name="correo"
                placeholder="ejemplo@correo.com"
                value={nuevoSocio.correo}
                onChange={cambiarDato}
                required
              />
            </label>

            <label>
              Contraseña
              <div className="password-campo">
                <input
                  type={verPassword ? "text" : "password"}
                  name="password"
                  placeholder="Crea una contraseña segura"
                  value={nuevoSocio.password}
                  onChange={cambiarDato}
                  required
                />

                <button
                  type="button"
                  onClick={() => setVerPassword(!verPassword)}
                >
                  {verPassword ? "Ocultar" : "Ver"}
                </button>
              </div>
            </label>

            <label>
              Confirmar contraseña
              <div className="password-campo">
                <input
                  type={verConfirmarPassword ? "text" : "password"}
                  name="confirmarPassword"
                  placeholder="Repite la contraseña"
                  value={nuevoSocio.confirmarPassword}
                  onChange={cambiarDato}
                  required
                />

                <button
                  type="button"
                  onClick={() =>
                    setVerConfirmarPassword(!verConfirmarPassword)
                  }
                >
                  {verConfirmarPassword ? "Ocultar" : "Ver"}
                </button>
              </div>
            </label>

            <div className="password-ayuda">
              La contraseña debe tener mínimo 8 caracteres, una mayúscula, una
              minúscula, un número y un símbolo.
            </div>

            <button type="submit">Guardar socio</button>
          </form>
        </section>
      )}

      {socioEditando && (
        <section className="panel-box formulario-socio">
          <h2>Editar socio</h2>

          <form onSubmit={guardarEdicion}>
            <label>
              Nombre completo
              <input
                type="text"
                name="nombre"
                value={socioEditando.nombre}
                onChange={cambiarEdicion}
                required
              />
            </label>

            <label>
              Correo electrónico
              <input
                type="email"
                name="correo"
                value={socioEditando.correo}
                onChange={cambiarEdicion}
                required
              />
            </label>

            <button type="submit">Guardar cambios</button>

            <button type="button" onClick={() => setSocioEditando(null)}>
              Cancelar
            </button>
          </form>
        </section>
      )}

      {historialSocio && (
        <section className="panel-box historial-box">
          <div className="historial-header">
            <h2>Historial de {historialSocio.nombre}</h2>
            <button onClick={() => setHistorialSocio(null)}>Cerrar</button>
          </div>

          <p>
            <strong>Correo:</strong> {historialSocio.correo}
          </p>
          <p>
            <strong>Rol:</strong> {historialSocio.rol}
          </p>
          <p>
            <strong>Estado:</strong>{" "}
            {historialSocio.estado ? "Activo" : "Inactivo"}
          </p>

          <div className="historial-lista">
            <div>Registro de socio creado en el sistema</div>
            <div>Sin historial de pagos real todavía</div>
            <div>Más adelante aquí aparecerán cuotas, pagos y recibos</div>
          </div>
        </section>
      )}

      <section className="panel-box">
        <div className="socios-toolbar">
          <input
            type="text"
            placeholder="Buscar por nombre, correo o código"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />

          <button>Buscar</button>
        </div>

        <div className="socios-lista">
          {cargando ? (
            <p>Cargando socios...</p>
          ) : sociosFiltrados.length === 0 ? (
            <p>No se encontraron socios.</p>
          ) : (
            sociosFiltrados.map((socio) => (
              <article className="socio-card" key={socio.id}>
                <div>
                  <h3>{socio.nombre}</h3>
                  <p>
                    Usuario #{socio.id} · {socio.correo}
                  </p>
                  <span>Rol: {socio.rol}</span>
                </div>

                <div className="socio-contacto">
                  <strong>
                    {socio.estado ? "Cuenta activa" : "Cuenta inactiva"}
                  </strong>

                  <em className={socio.estado ? "activo" : "inactivo"}>
                    {socio.estado ? "Activo" : "Inactivo"}
                  </em>
                </div>

                <div className="socio-acciones">
                  <button onClick={() => verHistorial(socio)}>
                    Ver historial
                  </button>

                  <button onClick={() => editarSocio(socio)}>Editar</button>

                  {socio.estado ? (
                    <button onClick={() => desactivarSocio(socio.id)}>
                      Desactivar
                    </button>
                  ) : (
                    <button onClick={() => activarSocio(socio.id)}>
                      Activar
                    </button>
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

export default Socios;