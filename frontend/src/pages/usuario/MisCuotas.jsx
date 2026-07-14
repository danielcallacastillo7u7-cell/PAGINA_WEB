import { useState } from "react";

function MisCuotas() {
  const usuario = JSON.parse(localStorage.getItem("usuario"));

  const [monto, setMonto] = useState("");
  const [metodo, setMetodo] = useState("Yape");
  const [comprobante, setComprobante] = useState(null);
  const [enviando, setEnviando] = useState(false);

  async function enviarPago(e) {
    e.preventDefault();

    if (!usuario?.id) {
      alert("No se encontró el usuario en sesión.");
      return;
    }

    if (!monto || !metodo || !comprobante) {
      alert("Completa monto, método y comprobante.");
      return;
    }

    const formData = new FormData();
    formData.append("usuario_id", usuario.id);
    formData.append("monto", monto);
    formData.append("metodo", metodo);
    formData.append("comprobante", comprobante);

    try {
      setEnviando(true);

      const respuesta = await fetch("http://localhost:3000/api/pagos", {
        method: "POST",
        body: formData,
      });

      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        alert(resultado.mensaje || "No se pudo enviar el pago.");
        return;
      }

      alert("Pago enviado correctamente. Queda pendiente de aprobación.");

      setMonto("");
      setMetodo("Yape");
      setComprobante(null);
      e.target.reset();
    } catch (error) {
      console.error(error);
      alert("Error al enviar pago.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section className="cuotas-page">
      <header className="perfil-header">
        <div>
          <span>Mis cuotas</span>
          <h1>Enviar comprobante de pago</h1>
          <p>
            Registra tu pago y adjunta una imagen del comprobante para que
            administración lo valide.
          </p>
        </div>
      </header>

      <section className="deuda-card deuda-pendiente">
        <div>
          <span className="estado-deuda">Pago pendiente de validación</span>
          <h2>Registrar pago</h2>
          <p>Tu comprobante será revisado por administración.</p>
        </div>
      </section>

      <section className="cuotas-box">
        <h2>Datos del pago</h2>

        <form className="pago-form" onSubmit={enviarPago}>
          <label>
            Monto pagado
            <input
              type="number"
              step="0.01"
              placeholder="Ejemplo: 180"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              required
            />
          </label>

          <label>
            Método de pago
            <select
              value={metodo}
              onChange={(e) => setMetodo(e.target.value)}
              required
            >
              <option value="Yape">Yape</option>
              <option value="Plin">Plin</option>
              <option value="Transferencia">Transferencia bancaria</option>
              <option value="Efectivo">Efectivo</option>
            </select>
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