import express from "express";
import pool from "../db.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    // Total de usuarios tipo socio
    const socios = await pool.query(`
      SELECT COUNT(*) AS total
      FROM usuarios
      WHERE rol='usuario'
    `);

    // Usuarios activos
    const activos = await pool.query(`
      SELECT COUNT(*) AS total
      FROM usuarios
      WHERE rol='usuario'
      AND estado=true
    `);

    // Pagos pendientes
    const pendientes = await pool.query(`
      SELECT COUNT(*) AS total
      FROM pagos
      WHERE estado='procesando'
    `);

    // Pagos rechazados (los tomaremos como morosos por ahora)
    const morosos = await pool.query(`
      SELECT COUNT(*) AS total
      FROM pagos
      WHERE estado='rechazado'
    `);

    // Dinero recaudado
    const recaudado = await pool.query(`
      SELECT COALESCE(SUM(monto),0) AS total
      FROM pagos
      WHERE estado='acreditado'
    `);

    res.json({
      socios: Number(socios.rows[0].total),
      activos: Number(activos.rows[0].total),
      pendientes: Number(pendientes.rows[0].total),
      morosos: Number(morosos.rows[0].total),
      recaudado: Number(recaudado.rows[0].total)
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({
      mensaje: "Error del servidor"
    });
  }
});

export default router;