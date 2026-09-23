import jwt from "jsonwebtoken";
import { config } from "../config.js";
import { pool } from "../db.js";
export async function autenticar(req, res, next) {
  const match = /^Bearer (\S+)$/.exec(req.get("authorization") || "");
  if (!match) return res.status(401).json({ mensaje: "Inicia sesión para continuar." });
  let claims;
  try { claims = jwt.verify(match[1], config.jwtSecret, { algorithms: ["HS256"] }); }
  catch { return res.status(401).json({ mensaje: "Sesión inválida o vencida." }); }
  try {
    const { rows } = await pool.query("SELECT id, nombre, correo, rol FROM usuarios WHERE id = $1 AND estado = true", [claims.id]);
    if (!rows[0]) return res.status(401).json({ mensaje: "Cuenta inactiva o inexistente." });
    req.usuario = rows[0];
    next();
  } catch (error) { next(error); }
}
export function roles(...permitidos) {
  return (req, res, next) => permitidos.includes(req.usuario?.rol)
    ? next() : res.status(403).json({ mensaje: "No tienes permiso para esta operación." });
}
