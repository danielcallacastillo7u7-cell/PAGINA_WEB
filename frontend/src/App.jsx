import Contacto from "./Contacto.jsx";
import "./App.css";

function App() {
  return (
    <div className="pagina">
      <section className="hero" id="inicio">
        <header className="navbar">
          <h2 className="logo">Club Catarindo</h2>

          <nav className="menu">
            <a href="#inicio">Inicio</a>
            <a href="#servicios">Servicios</a>
            <a href="#galeria">Espacios</a>
            <a href="#contacto">Contacto</a>
          </nav>

          <a className="btn-login" href="/login">
            Iniciar sesión
          </a>
        </header>

        <div className="hero-contenido">
          <span className="hero-etiqueta">Club privado de viviendas</span>

          <h1>Disfruta comodidad, seguridad y diversión en un solo lugar</h1>

          <p>
            Un club residencial pensado para familias, vecinos y propietarios
            que buscan espacios modernos para relajarse, compartir y disfrutar.
          </p>

          <div className="botones">
            <a href="#servicios" className="btn-principal">
              Conocer servicios
            </a>

            <a href="#galeria" className="btn-secundario">
              Ver espacios
            </a>
          </div>
        </div>
      </section>

      <section className="servicios" id="servicios">
        <div className="titulo-seccion">
          <span className="etiqueta">Servicios</span>
          <h2>Espacios para disfrutar todos los días</h2>
          <p>
            Nuestro club cuenta con servicios pensados para la comodidad,
            recreación y bienestar de toda la comunidad.
          </p>
        </div>

        <div className="cards">
          <article className="card servicio-card">
            <img
              src="https://images.unsplash.com/photo-1575429198097-0414ec08e8cd?auto=format&fit=crop&w=900&q=80"
              alt="Piscina del club"
            />
            <div className="card-contenido">
              <h3>Piscina</h3>
              <p>Zona amplia para relajarse, nadar y compartir en familia.</p>
              <a className="btn-principal" href="#contacto">Consultar disponibilidad</a>
            </div>
          </article>

          <article className="card servicio-card">
            <img
              src="https://images.unsplash.com/photo-1596464716127-f2a82984de30?auto=format&fit=crop&w=900&q=80"
              alt="Zona de juegos"
            />
            <div className="card-contenido">
              <h3>Zona de juegos</h3>
              <p>Espacios seguros para niños, actividades y entretenimiento.</p>
              <a className="btn-principal" href="#contacto">Consultar disponibilidad</a>
            </div>
          </article>

          <article className="card servicio-card">
            <img
              src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=80"
              alt="Áreas verdes"
            />
            <div className="card-contenido">
              <h3>Áreas verdes</h3>
              <p>Jardines y zonas tranquilas para descansar o caminar.</p>
              <a className="btn-principal" href="#contacto">Consultar disponibilidad</a>
            </div>
          </article>

          <article className="card servicio-card">
            <img
              src="https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=900&q=80"
              alt="Zona deportiva"
            />
            <div className="card-contenido">
              <h3>Zona deportiva</h3>
              <p>Canchas y espacios para entrenar, jugar y mantenerse activo.</p>
              <a className="btn-principal" href="#contacto">Consultar disponibilidad</a>
            </div>
          </article>

          <article className="card servicio-card">
            <img
              src="https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=900&q=80"
              alt="Salón de eventos"
            />
            <div className="card-contenido">
              <h3>Salón de eventos</h3>
              <p>Ambiente ideal para reuniones, celebraciones y actividades.</p>
              <a className="btn-principal" href="#contacto">Consultar disponibilidad</a>
            </div>
          </article>

          <article className="card servicio-card">
            <img
              src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=900&q=80"
              alt="Seguridad residencial"
            />
            <div className="card-contenido">
              <h3>Seguridad</h3>
              <p>Control de acceso y ambiente seguro para los residentes.</p>
              <a className="btn-principal" href="#contacto">Consultar disponibilidad</a>
            </div>
          </article>
        </div>
      </section>

      <section className="galeria" id="galeria">
        <div className="galeria-texto">
          <span className="etiqueta">Espacios destacados</span>
          <h2>Un club pensado para vivir mejor</h2>
          <p>
            Cada zona está diseñada para que los residentes puedan disfrutar
            experiencias cómodas, ordenadas y modernas.
          </p>
        </div>

        <div className="galeria-grid">
          <div className="galeria-item grande">
            <img
              src="https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1000&q=80"
              alt="Residencial moderno"
            />
            <span>Residencial privado</span>
          </div>

          <div className="galeria-item">
            <img
              src="https://images.unsplash.com/photo-1596178065887-1198b6148b2b?auto=format&fit=crop&w=900&q=80"
              alt="Área social"
            />
            <span>Área social</span>
          </div>

          <div className="galeria-item">
            <img
              src="https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=900&q=80"
              alt="Viviendas"
            />
            <span>Viviendas</span>
          </div>
        </div>
      </section>

      <Contacto />

      <footer className="footer">
        <p>© 2026 Club Residencial. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}

export default App;