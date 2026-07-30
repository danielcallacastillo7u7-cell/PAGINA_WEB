import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const resultado = await pool.query(`
      SELECT
        id,
        nombre,
        correo,
        estado,
        rol
      FROM usuarios
      WHERE rol = 'usuario'
      ORDER BY nombre
    `);

    res.json(resultado.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      mensaje: "Error obteniendo socios",
    });
  }
});

export default router;