import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

function Login() {
  const navigate = useNavigate();

  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [codigo, setCodigo] = useState("");
  const [usuarioPendiente, setUsuarioPendiente] = useState(null);
  const [pasoCodigo, setPasoCodigo] = useState(false);
  const [cargando, setCargando] = useState(false);

  function entrarPorRol(usuario) {
    if (usuario.rol === "admin") {
      navigate("/admin");
    } else if (usuario.rol === "jefe") {
      navigate("/jefe");
    } else if (usuario.rol === "contador") {
      navigate("/contador");
    } else {
      navigate("/usuario");
    }
  }

  async function iniciarSesion(e) {
    e.preventDefault();

    try {
      setCargando(true);

      const respuesta = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ correo, password }),
      });

      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        alert(resultado.mensaje || "Error al iniciar sesion");
        return;
      }

      if (resultado.requiereCodigo) {
        setUsuarioPendiente(resultado.usuarioPendiente);
        setPasoCodigo(true);
        alert("Te enviamos un codigo al correo administrativo.");
        return;
      }

      localStorage.setItem("token", resultado.token);
      localStorage.setItem("usuario", JSON.stringify(resultado.usuario));
      entrarPorRol(resultado.usuario);
    } catch (error) {
      console.error(error);
      alert("No se pudo conectar con el servidor.");
    } finally {
      setCargando(false);
    }
  }

  async function verificarCodigo(e) {
    e.preventDefault();

    if (!usuarioPendiente?.id) {
      alert("Vuelve a iniciar sesion para pedir un nuevo codigo.");
      setPasoCodigo(false);
      return;
    }

    try {
      setCargando(true);

      const respuesta = await fetch("http://localhost:3000/api/auth/verificar-jefe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          usuarioId: usuarioPendiente.id,
          codigo,
        }),
      });

      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        alert(resultado.mensaje || "Codigo incorrecto");
        return;
      }

      localStorage.setItem("token", resultado.token);
      localStorage.setItem("usuario", JSON.stringify(resultado.usuario));
      entrarPorRol(resultado.usuario);
    } catch (error) {
      console.error(error);
      alert("No se pudo verificar el codigo.");
    } finally {
      setCargando(false);
    }
  }

  function volverAlLogin() {
    setPasoCodigo(false);
    setCodigo("");
    setUsuarioPendiente(null);
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-info">
          <span className="login-etiqueta">Club Residencial</span>

          <h1>Bienvenido de nuevo</h1>

          <p>
            Ingresa con tu cuenta para acceder al panel que corresponde a tu rol
            dentro del club.
          </p>

          <div className="login-beneficios">
            <div>
              <strong>Acceso seguro</strong>
              <span>Panel separado para cada tipo de usuario.</span>
            </div>

            <div>
              <strong>Area administrativa</strong>
              <span>El jefe confirma su ingreso con un codigo enviado al correo.</span>
            </div>
          </div>
        </div>

        {!pasoCodigo ? (
          <form className="login-form" onSubmit={iniciarSesion}>
            <span className="admin-badge">Acceso administrativo y socios</span>
            <h2>Iniciar sesion</h2>

            <div className="admin-access-box">
              <strong>Administrativo</strong>
              <p>
                Si tu cuenta tiene rol de jefe, despues de validar tu contrasena
                se solicitara un codigo de seguridad.
              </p>
            </div>

            <label>
              Correo electronico
              <input
                type="email"
                placeholder="correo@ejemplo.com"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                required
              />
            </label>

            <label>
              Contrasena
              <input
                type="password"
                placeholder="Ingresa tu contrasena"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>

            <button type="submit" disabled={cargando}>
              {cargando ? "Validando..." : "Entrar al panel"}
            </button>

            <a href="/" className="volver-link">Volver al inicio</a>
          </form>
        ) : (
          <form className="login-form" onSubmit={verificarCodigo}>
            <span className="admin-badge">Verificacion administrativa</span>
            <h2>Codigo de seguridad</h2>

            <div className="admin-access-box">
              <strong>Revisa tu correo</strong>
              <p>
                Enviamos un codigo de 6 digitos a {usuarioPendiente?.correo}.
                Ingresa ese codigo para abrir el panel de jefe.
              </p>
            </div>

            <label>
              Codigo recibido
              <input
                type="text"
                placeholder="Ejemplo: 123456"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                maxLength="6"
                required
              />
            </label>

            <button type="submit" disabled={cargando}>
              {cargando ? "Verificando..." : "Verificar y entrar"}
            </button>

            <button className="btn-secundario-login" type="button" onClick={volverAlLogin}>
              Cambiar correo
            </button>
          </form>
        )}
      </section>
    </main>
  );
}

export default Login;
