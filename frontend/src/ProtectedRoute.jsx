import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { apiFetch } from "./api.js";
export default function ProtectedRoute({ rol, children }) {
  const [estado, setEstado] = useState("cargando");
  useEffect(() => {
    let active = true;
    apiFetch("/api/auth/me").then(async r => {
      if (!r.ok) throw new Error("Sesión inválida");
      const { usuario } = await r.json();
      if (active) {
        localStorage.setItem("usuario", JSON.stringify(usuario));
        setEstado(usuario.rol === rol ? "ok" : "denegado");
      }
    }).catch(() => { if (active) setEstado("denegado"); });
    return () => { active = false; };
  }, [rol]);
  if (estado === "cargando") return <p>Validando sesión…</p>;
  return estado === "ok" ? children : <Navigate to="/login" replace />;
}
