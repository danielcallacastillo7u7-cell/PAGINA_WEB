import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

function Login() {
  const navigate = useNavigate();

  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");

  async function iniciarSesion(e) {
    e.preventDefault();

    const datos = {
      correo,
      password,
    };

    const respuesta = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(datos),
    });

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      alert(resultado.mensaje || "Error al iniciar sesión");
      return;
    }

    localStorage.setItem("token", resultado.token);
    localStorage.setItem("usuario", JSON.stringify(resultado.usuario));

    const rol = resultado.usuario.rol;

    if (rol === "admin") {
      navigate("/admin");
    } else if (rol === "jefe") {
      navigate("/jefe");
    } else if (rol === "contador") {
      navigate("/contador");
    } else {
      navigate("/usuario");
    }
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
              <strong>Gestión rápida</strong>
              <span>Consulta información, solicitudes y actividades.</span>
            </div>
          </div>
        </div>

        <form className="login-form" onSubmit={iniciarSesion}>
          <h2>Iniciar sesión</h2>

          <label>
            Correo electrónico
            <input
              type="email"
              placeholder="correo@ejemplo.com"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              required
            />
          </label>

          <label>
            Contraseña
            <input
              type="password"
              placeholder="Ingresa tu contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          <button type="submit">Entrar al panel</button>

          <a href="/" className="volver-link">Volver al inicio</a>
        </form>
      </section>
    </main>
  );
}

export default Login;