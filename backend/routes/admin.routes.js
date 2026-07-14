import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

router.get("/socios", async (req, res) => {
  try {
    const resultado = await pool.query(
      `SELECT id, nombre, correo, rol, estado, fecha_creacion
       FROM usuarios
       WHERE rol = 'usuario'
       ORDER BY id DESC`
    );

    res.json(resultado.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      mensaje: "Error al obtener socios",
    });
  }
});
router.put("/socios/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, correo } = req.body;

    const resultado = await pool.query(
      `UPDATE usuarios
       SET nombre = $1, correo = $2
       WHERE id = $3 AND rol = 'usuario'
       RETURNING id, nombre, correo, rol, estado`,
      [nombre, correo, id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({
        mensaje: "Socio no encontrado",
      });
    }

    res.json({
      mensaje: "Socio actualizado correctamente",
      socio: resultado.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      mensaje: "Error al actualizar socio",
    });
  }
});

router.patch("/socios/:id/desactivar", async (req, res) => {
  try {
    const { id } = req.params;

    const resultado = await pool.query(
      `UPDATE usuarios
       SET estado = false
       WHERE id = $1 AND rol = 'usuario'
       RETURNING id, nombre, correo, rol, estado`,
      [id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({
        mensaje: "Socio no encontrado",
      });
    }

    res.json({
      mensaje: "Socio desactivado correctamente",
      socio: resultado.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      mensaje: "Error al desactivar socio",
    });
  }
});
router.patch("/socios/:id/activar", async (req, res) => {
  try {
    const { id } = req.params;

    const resultado = await pool.query(
      `UPDATE usuarios
       SET estado = true
       WHERE id = $1 AND rol = 'usuario'
       RETURNING id, nombre, correo, rol, estado`,
      [id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({
        mensaje: "Socio no encontrado",
      });
    }

    res.json({
      mensaje: "Socio activado correctamente",
      socio: resultado.rows[0],
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      mensaje: "Error al activar socio",
    });
  }
});

export default router;