import { useState } from "react";

function MisCuotas() {
  const usuario = JSON.parse(localStorage.getItem("usuario"));

  const [descripcion, setDescripcion] = useState("");
  const [comprobante, setComprobante] = useState(null);
  const [enviando, setEnviando] = useState(false);

  async function enviarPago(e) {
    e.preventDefault();

    if (!usuario?.id) {
      alert("No se encontro el usuario en sesion.");
      return;
    }

    if (!descripcion || !comprobante) {
      alert("Escribe la descripcion del pago y sube tu comprobante.");
      return;
    }

    const formData = new FormData();
    formData.append("usuario_id", usuario.id);
    formData.append("descripcion", descripcion);
    formData.append("comprobante", comprobante);

    try {
      setEnviando(true);

      const respuesta = await fetch("http://localhost:3000/api/pagos", {
        method: "POST",
        body: formData,
      });

      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        alert(resultado.mensaje || "No se pudo enviar la solicitud de pago.");
        return;
      }

      alert("Solicitud de pago enviada correctamente. Queda pendiente de validacion.");

      setDescripcion("");
      setComprobante(null);
      e.target.reset();
    } catch (error) {
      console.error(error);
      alert("Error al enviar la solicitud de pago.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section className="cuotas-page">
      <header className="perfil-header">
        <div>
          <span>Mis cuotas</span>
          <h1>Enviar comprobante</h1>
          <p>
            Describe a que corresponde tu pago y adjunta el comprobante para que administracion lo valide.
          </p>
        </div>
      </header>

      <section className="deuda-card deuda-pendiente">
        <div>
          <span className="estado-deuda">Solicitud pendiente de validacion</span>
          <h2>Comprobante de pago</h2>
          <p>Tu solicitud quedara registrada como procesando hasta que el administrador la revise.</p>
        </div>
      </section>

      <section className="cuotas-box">
        <h2>Datos de la solicitud</h2>

        <form className="pago-form" onSubmit={enviarPago}>
          <label>
            Descripcion del pago
            <textarea
              placeholder="Ejemplo: Pago de cuota de julio, mantenimiento o reserva de salon"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows="4"
              required
            />
          </label>

          <label>
            Comprobante de pago
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setComprobante(e.target.files[0])}
              required
            />
          </label>

          {comprobante && (
            <div className="comprobante-preview">
              <span>Vista previa</span>
              <img
                src={URL.createObjectURL(comprobante)}
                alt="Comprobante seleccionado"
              />
            </div>
          )}

          <button className="btn-pagar ancho" type="submit" disabled={enviando}>
            {enviando ? "Enviando..." : "Enviar comprobante"}
          </button>
        </form>
      </section>
    </section>
  );
}

export default MisCuotas;
